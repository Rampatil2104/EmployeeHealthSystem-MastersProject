// src/components/PredictButton.jsx
import { useState } from "react";
import { postPredict } from "@/services/api";

export default function PredictButton({ employee, onResult }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Try to find a usable ID in multiple common fields
  const getEmployeeId = (e) =>
    e?.EmployeeID || e?.employeeId || e?.id || e?.EmployeeId || null;

  const handlePredict = async () => {
    setLoading(true);
    setErr(null);
    try {
      const eid = getEmployeeId(employee);
      if (!eid) {
        throw new Error("No employeeId found on selected employee");
      }

      // FastAPI expects { employeeId: "E12345" }
      const { data } = await postPredict({ employeeId: String(eid) });

      // Bubble result up to the parent (so it can render the numbers)
      onResult?.(data);
    } catch (e) {
      // Show server payload if present
      const details = e?.response?.data || e?.message || "Prediction failed";
      setErr(details);
      console.error("predict error:", details);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePredict}
        disabled={loading}
        className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Predicting…" : "Predict Health"}
      </button>

      {err && (
        <span className="text-red-600 text-sm">
          {typeof err === "string" ? err : err?.error || "Request failed"}
        </span>
      )}
    </div>
  );
}
