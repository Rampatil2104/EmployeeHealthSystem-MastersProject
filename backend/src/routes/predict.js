// backend/src/routes/predict.js
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import * as ort from 'onnxruntime-node';
import { fileURLToPath } from 'url';

const router = Router();

// ---------- resolve model directory (backend/onnx) ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function pickExisting(...candidates) {
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return candidates[0];
}

const MODELS_DIR = pickExisting(
  path.resolve(__dirname, '..', '..', 'onnx'),   // backend/onnx
  path.resolve(process.cwd(), 'onnx'),           // if running from backend
  path.resolve(process.cwd(), 'backend', 'onnx') // if running from repo root
);
console.log('🧭 MODELS_DIR →', MODELS_DIR);

// ---------- artifact paths ----------
const FEATURE_ORDER_PATH  = path.join(MODELS_DIR, 'feature_order.json');
const SCALER_PATH         = path.join(MODELS_DIR, 'scaler.json');      // optional
const RISK_MODEL_PATH     = path.join(MODELS_DIR, 'risk.onnx');
const MENTAL_MODEL_PATH   = path.join(MODELS_DIR, 'mental.onnx');      // (not used here, but ready)
const PHYSICAL_MODEL_PATH = path.join(MODELS_DIR, 'physical.onnx');    // (not used here, but ready)

// ---------- lazy-loaded singletons ----------
let featureOrderNum = [];
let featureOrderCat = [];
let scaler = null;
let riskSession = null;

// ---------- helpers ----------
const toFloat = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

// scalar → **[1,1]** tensors to match your export
const t1f = (x) => new ort.Tensor('float32', Float32Array.from([toFloat(x)]), [1, 1]);
const t1i = (x) => {
  const n = BigInt(Math.trunc(Number(x) || 0));
  return new ort.Tensor('int64', BigInt64Array.from([n]), [1, 1]);
};
const t1s = (x) => new ort.Tensor('string', [String(x ?? '')], [1, 1]);

const loadJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));
const tryLoadJSON = (p) => (fs.existsSync(p) ? loadJSON(p) : null);

function ensureArtifactsLoaded() {
  if (!featureOrderNum.length && fs.existsSync(FEATURE_ORDER_PATH)) {
    const fo = loadJSON(FEATURE_ORDER_PATH);
    featureOrderNum = Array.isArray(fo?.num) ? fo.num : [];
    featureOrderCat = Array.isArray(fo?.cat) ? fo.cat : [];
    console.log(`📘 Loaded feature_order.json → ${featureOrderNum.length} numeric, ${featureOrderCat.length} categorical`);
  }
  if (scaler === null) {
    scaler = tryLoadJSON(SCALER_PATH);
    if (!scaler) console.warn('⚠️ scaler.json not found — continuing without scaling');
  }
}

async function ensureRiskSession() {
  if (!fs.existsSync(RISK_MODEL_PATH)) {
    throw new Error('risk.onnx not found');
  }
  if (!riskSession) {
    try {
      // Default (CPU) EP
      riskSession = await ort.InferenceSession.create(RISK_MODEL_PATH);
    } catch (e1) {
      console.warn('⚠️ Default session create failed, retrying with explicit CPU EP:', e1?.message);
      riskSession = await ort.InferenceSession.create(RISK_MODEL_PATH, { executionProviders: ['cpu'] });
    }
    console.log('✅ risk.onnx loaded (CPU)');
  }
  return riskSession;
}

function maybeScaleVector(vec) {
  if (!scaler) return vec;
  const { mean_, scale_ } = scaler;
  if (Array.isArray(mean_) && Array.isArray(scale_)) {
    return vec.map((x, i) => (x - (mean_[i] ?? 0)) / (scale_[i] || 1));
  }
  return vec;
}

function buildFeedsForMultiInput(session, source) {
  const feeds = {};
  const inputNames = Array.isArray(session.inputNames)
    ? session.inputNames
    : Object.keys(session.inputMetadata || {});
  const meta = session.inputMetadata || {};

  // Fill known numeric features
  for (const name of featureOrderNum) {
    if (inputNames.includes(name)) feeds[name] = t1f(source?.[name]);
  }
  // Fill known categorical features
  for (const name of featureOrderCat) {
    if (inputNames.includes(name)) feeds[name] = t1s(source?.[name]);
  }

  // Pad remaining inputs with the correct dtype using metadata
  for (const name of inputNames) {
    if (feeds[name]) continue;
    const m = meta[name];
    const type = (m && m.type) || ''; // e.g., 'tensor(string)', 'tensor(float)', 'tensor(int64)'
    if (type.includes('string'))      feeds[name] = t1s('');
    else if (type.includes('int64'))  feeds[name] = t1i(0);
    else                               feeds[name] = t1f(0);
  }
  return feeds;
}

async function runRisk(source) {
  ensureArtifactsLoaded();
  const session = await ensureRiskSession();

  const inputNames = Array.isArray(session.inputNames)
    ? session.inputNames
    : Object.keys(session.inputMetadata || {});
  let outputs;

  if (inputNames.length > 1) {
    // MULTI-INPUT model (one ONNX input per original column name)
    const feeds = buildFeedsForMultiInput(session, source);
    outputs = await session.run(feeds);
  } else {
    // SINGLE-INPUT model (one dense float vector [1, n])
    const singleName =
      inputNames[0] ||
      Object.keys(session.inputMetadata || {})[0] ||
      'input';

    const vec = maybeScaleVector(featureOrderNum.map((n) => toFloat(source?.[n])));
    const inputTensor = new ort.Tensor('float32', Float32Array.from(vec), [1, vec.length]);
    outputs = await session.run({ [singleName]: inputTensor });
  }

  // Normalize output to JSON arrays
  return Object.fromEntries(
    Object.entries(outputs).map(([k, t]) => [k, Array.from(t.data)])
  );
}

// ----------------------------------------------------------
// POST /api/predict
// body:
//   { employeeId: "E78096" }
//   OR
//   { features: { ... original columns ... } }
// ----------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { employeeId, features } = req.body || {};
    let source = {};

    if (features && typeof features === 'object') {
      source = features;
    } else if (employeeId) {
      // Use EmployeeID field (string like "E78096"), not Mongo _id
      const doc = await mongoose.connection.db
        .collection('employees')
        .findOne({ EmployeeID: employeeId });
      if (!doc) return res.status(404).json({ error: 'Employee not found' });
      source = doc;
    } else {
      return res.status(400).json({ error: 'Provide either { employeeId } or { features }' });
    }

    const outputs = await runRisk(source);

    // Optional: if your classifier exported ZipMap=False, you likely have
    // 'label' and 'probabilities' keys here. We return the raw outputs along with
    // a tiny summary if available.
    let summary = null;
    if (outputs.label && outputs.label.length) {
      const lbl = outputs.label[0];
      summary = { label: lbl };
      if (outputs.probabilities) {
        // probabilities is [pHigh, pMedium, pLow] or similar depending on export order
        summary.probabilities = outputs.probabilities;
      }
    }

    res.json({
      ok: true,
      model: path.basename(RISK_MODEL_PATH),
      usedNumeric: featureOrderNum.length,
      usedCategorical: featureOrderCat.length,
      outputs,
      summary
    });
  } catch (err) {
    console.error('💥 Prediction error:', err);
    res.status(500).json({ error: 'Prediction failed', details: err.message });
  }
});

export default router;
