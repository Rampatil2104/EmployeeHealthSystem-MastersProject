import axios from "axios";

// --- Node/Express backend (Mongo + Analytics) ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  timeout: 15000,
});

// --- FastAPI backend (ONNX Inference) ---
const predictApi = axios.create({
  baseURL: import.meta.env.VITE_PREDICT_URL || "http://127.0.0.1:8000",
  timeout: 15000,
});

// ============ NODE BACKEND ENDPOINTS ============

// Basic health check
export const getHealth = () => api.get("/api/health");

// Employees
export const getEmployees = (params) => api.get("/api/employees", { params });
export const getEmployee = (id) => api.get(`/api/employees/${id}`);

// Analytics
export const getRiskDistribution = () => api.get("/api/analytics/risk-distribution");
export const getDepartmentSizes = () => api.get("/api/analytics/department-sizes");
export const getWellnessByDept = () => api.get("/api/analytics/wellness-by-dept");
export const getStressVsWLB = (params) => api.get("/api/analytics/stress-wlb", { params });
export const getAttritionByTenure = () => api.get("/api/analytics/attrition-tenure");
export const getGenderRiskByDept = () => api.get("/api/analytics/gender-risk");
export const getCorrelationMatrix = () => api.get("/api/analytics/correlations");
export const getWellnessRadar = () => api.get("/api/analytics/wellness-radar");

// Extra analytics endpoints (Group/Advanced Charts)
export const getDeptRiskSankey = () => api.get("/api/analytics/department-risk-sankey");
export const getDeptRadar = (params) => api.get("/api/analytics/department-radar", { params });
export const getEducationHealth = () => api.get("/api/analytics/education-health");
export const get3DStressSleepWLB = () => api.get("/api/analytics/stress-sleep-wlb-3d");

// ============ FASTAPI (ONNX) ENDPOINTS ============

// Predict by employee ID
export const postPredictById = (employeeId) =>
  predictApi.post("/predict", { employeeId });

// Predict by manual features
export const postPredictByFeatures = (features) =>
  predictApi.post("/predict", { features });

// Back-compat: existing components expect postPredict(payload)
export const postPredict = (payload) => predictApi.post("/predict", payload);

// Export both
export default api;
