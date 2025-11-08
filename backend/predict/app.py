import os
import json
import numpy as np
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import onnxruntime as ort

# Optional Mongo lookup (for employeeId)
try:
    from pymongo import MongoClient
except Exception:
    MongoClient = None  # if not installed, employeeId lookups are disabled

# ------------ env / paths ------------
load_dotenv()

HERE = os.path.dirname(os.path.abspath(__file__))

def pick_existing(*candidates: str) -> str:
    for p in candidates:
        if os.path.exists(p):
            return p
    return candidates[0]

# Default search order: ./onnx (next to app.py), ../onnx, repo-root/backend/onnx
MODELS_DIR = pick_existing(
    os.path.join(HERE, "onnx"),
    os.path.join(HERE, "..", "onnx"),
    os.path.join(HERE, "..", "..", "backend", "onnx"),
)

FEATURE_ORDER_PATH = os.path.join(MODELS_DIR, "feature_order.json")
SCALER_PATH        = os.path.join(MODELS_DIR, "scaler.json")
RISK_MODEL_PATH    = os.path.join(MODELS_DIR, "risk.onnx")
MENTAL_MODEL_PATH  = os.path.join(MODELS_DIR, "mental.onnx")
PHYSICAL_MODEL_PATH= os.path.join(MODELS_DIR, "physical.onnx")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/employeehealth")
MONGO_DB  = os.getenv("MONGO_DB",  "employeehealth")
MONGO_COL = os.getenv("MONGO_COL", "employees")

# ------------ fastapi app ------------
app = FastAPI(title="Employee Health ONNX Predictor", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------ pydantic models ------------
class PredictRequest(BaseModel):
    employeeId: Optional[str] = None
    features: Optional[Dict[str, Any]] = None

# ------------ globals (loaded lazily) ------------
FEATURE_ORDER_NUM: List[str] = []
FEATURE_ORDER_CAT: List[str] = []
SCALER: Optional[Dict[str, Any]] = None

risk_sess: Optional[ort.InferenceSession] = None
mental_sess: Optional[ort.InferenceSession] = None
physical_sess: Optional[ort.InferenceSession] = None

mongo_client: Optional[MongoClient] = None

# ------------ loaders ------------
def load_feature_order():
    global FEATURE_ORDER_NUM, FEATURE_ORDER_CAT
    if os.path.exists(FEATURE_ORDER_PATH):
        with open(FEATURE_ORDER_PATH, "r", encoding="utf-8") as f:
            fo = json.load(f)
        FEATURE_ORDER_NUM = list(fo.get("num", []))
        FEATURE_ORDER_CAT = list(fo.get("cat", []))
        print(f"📘 feature_order.json → {len(FEATURE_ORDER_NUM)} numeric, {len(FEATURE_ORDER_CAT)} categorical")
    else:
        FEATURE_ORDER_NUM, FEATURE_ORDER_CAT = [], []

def load_scaler():
    global SCALER
    if os.path.exists(SCALER_PATH):
        with open(SCALER_PATH, "r", encoding="utf-8") as f:
            SCALER = json.load(f)
        print("📘 scaler.json loaded")
    else:
        SCALER = None

def ensure_sessions():
    global risk_sess, mental_sess, physical_sess
    if risk_sess is None:
        if not os.path.exists(RISK_MODEL_PATH):
            raise FileNotFoundError("risk.onnx not found")
        risk_sess = ort.InferenceSession(RISK_MODEL_PATH, providers=["CPUExecutionProvider"])
        print("✅ risk.onnx loaded")
    if mental_sess is None and os.path.exists(MENTAL_MODEL_PATH):
        mental_sess = ort.InferenceSession(MENTAL_MODEL_PATH, providers=["CPUExecutionProvider"])
        print("✅ mental.onnx loaded")
    if physical_sess is None and os.path.exists(PHYSICAL_MODEL_PATH):
        physical_sess = ort.InferenceSession(PHYSICAL_MODEL_PATH, providers=["CPUExecutionProvider"])
        print("✅ physical.onnx loaded")

def ensure_mongo():
    global mongo_client
    if mongo_client is None and MongoClient is not None and MONGO_URI:
        mongo_client = MongoClient(MONGO_URI)

# ------------ numeric / string tensor helpers ------------
def to_float_tensor_1x1(x: float):
    return np.array([[float(x)]], dtype=np.float32)

def to_string_tensor_1x1(s: Any):
    # onnxruntime requires dtype=object for string tensors
    if s is None:
        s = ""
    return np.array([[str(s)]], dtype=object)

def apply_scaler_if_present(vec: np.ndarray) -> np.ndarray:
    if SCALER is None:
        return vec
    mean_ = np.array(SCALER.get("mean_", []), dtype=np.float32)
    scale_ = np.array(SCALER.get("scale_", []), dtype=np.float32)
    if mean_.shape == vec.shape == scale_.shape:
        return (vec - mean_) / np.where(scale_ == 0, 1.0, scale_)
    return vec

# ------------ dynamic runner ------------
def run_model_dynamic(session: ort.InferenceSession, source: Dict[str, Any]):
    """
    Works with both:
    - Multi-input models (separate inputs per feature, including tensor(string))
    - Single-input models (a single numeric vector)
    """
    # Try legacy metadata first
    try:
        inputs_meta = {i.name: i for i in session.get_inputs()}
        input_names = list(inputs_meta.keys())
    except Exception:
        meta = getattr(session, "input_metadata", {}) or {}
        inputs_meta = {k: v for k, v in meta.items()}
        input_names = list(inputs_meta.keys())

    # Multi-input case: one (1,1) tensor per feature name
    if len(input_names) > 1:
        feeds = {}
        # numeric first
        for name in FEATURE_ORDER_NUM:
            if name in input_names:
                feeds[name] = to_float_tensor_1x1(source.get(name, 0.0))
        # categoricals
        for name in FEATURE_ORDER_CAT:
            if name in input_names:
                feeds[name] = to_string_tensor_1x1(source.get(name, ""))

        # ensure all inputs are present with safe defaults
        for nm in input_names:
            if nm not in feeds:
                meta = inputs_meta.get(nm)
                ort_type = str(getattr(meta, "type", "")).lower() if meta else ""
                if "string" in ort_type:
                    feeds[nm] = to_string_tensor_1x1("")
                else:
                    feeds[nm] = to_float_tensor_1x1(0.0)

        return session.run(None, feeds)

    # Single-input case: one vector (1, N) with numeric features only
    single_name = input_names[0]
    vec = np.array([source.get(n, 0.0) for n in FEATURE_ORDER_NUM], dtype=np.float32)
    vec = apply_scaler_if_present(vec)
    batch = np.expand_dims(vec, axis=0)  # (1, N)
    return session.run(None, {single_name: batch})

# ------------ routes ------------
@app.on_event("startup")
def _startup():
    print(f"🔎 MODELS_DIR → {MODELS_DIR}")
    load_feature_order()
    load_scaler()
    ensure_mongo()
    # do not load sessions yet; we’ll lazy-load on first /predict so the server starts even if files are missing

@app.get("/health")
def health():
    return {
        "ok": True,
        "models_dir": MODELS_DIR,
        "has_feature_order": os.path.exists(FEATURE_ORDER_PATH),
        "has_scaler": os.path.exists(SCALER_PATH),
        "risk_exists": os.path.exists(RISK_MODEL_PATH),
        "mental_exists": os.path.exists(MENTAL_MODEL_PATH),
        "physical_exists": os.path.exists(PHYSICAL_MODEL_PATH),
        "num_features": len(FEATURE_ORDER_NUM),
        "cat_features": len(FEATURE_ORDER_CAT),
    }

@app.post("/predict")
def predict(req: PredictRequest):
    # ensure models loaded
    try:
        ensure_sessions()
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Build `source` either from features or by employeeId (Mongo optional)
    source: Dict[str, Any] = {}
    if req.features and isinstance(req.features, dict):
        source = dict(req.features)
    elif req.employeeId:
        if mongo_client is None:
            raise HTTPException(status_code=400, detail="MongoDB not configured for employeeId lookup")
        doc = mongo_client[MONGO_DB][MONGO_COL].find_one({"EmployeeID": req.employeeId})
        if not doc:
            raise HTTPException(status_code=404, detail="Employee not found")
        # convert ObjectId etc. to plain types
        for k, v in doc.items():
            if k != "_id":
                source[k] = v
    else:
        raise HTTPException(status_code=400, detail="Provide either { employeeId } or { features }")

    # Run risk (always available if file exists). Mental/Physical optional.
    try:
        risk_out = run_model_dynamic(risk_sess, source)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"risk.onnx run failed: {e}")

    # produce friendly outputs
    def tensor_to_list(t):
        # ORT returns numpy arrays or OrtValues depending on version
        try:
            data = getattr(t, "data", None)
            if data is not None:
                return list(data)
        except Exception:
            pass
        try:
            return t.tolist()
        except Exception:
            return [str(t)]

    resp = {
        "ok": True,
        "used_numeric": len(FEATURE_ORDER_NUM),
        "used_categorical": len(FEATURE_ORDER_CAT),
        "risk": {k: tensor_to_list(v) for k, v in (risk_out if isinstance(risk_out, dict) else dict(enumerate(risk_out))).items()},
    }

    # optional heads
    if mental_sess is not None:
        try:
            mental_out = run_model_dynamic(mental_sess, source)
            resp["mental"] = {k: tensor_to_list(v) for k, v in (mental_out if isinstance(mental_out, dict) else dict(enumerate(mental_out))).items()}
        except Exception as e:
            resp["mental_error"] = f"{e}"

    if physical_sess is not None:
        try:
            physical_out = run_model_dynamic(physical_sess, source)
            resp["physical"] = {k: tensor_to_list(v) for k, v in (physical_out if isinstance(physical_out, dict) else dict(enumerate(physical_out))).items()}
        except Exception as e:
            resp["physical_error"] = f"{e}"

    return resp
