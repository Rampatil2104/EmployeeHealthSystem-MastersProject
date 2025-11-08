import PredictButton from "./PredictButton";
import StatBadge from "./StatBadge";

export default function ProfileCard({ employee, prediction, onPredicted }) {
  if (!employee) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6 flex items-center justify-center text-slate-500">
        Select a row →
      </div>
    );
  }

  const chips = [
    { label: "Risk", value: employee.RiskCategory2 },
    { label: "Stress", value: employee["Stress Level"]?.toFixed(2) },
    { label: "WLB", value: employee.WorkLifeBalance?.toFixed(2) },
    { label: "Sleep", value: employee["Sleep Duration"]?.toFixed(2) },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{employee.EmployeeID}</h3>
          <p className="text-slate-500">{employee.Department} · {employee.JobRole}</p>
        </div>
        <PredictButton employee={employee} onPredicted={onPredicted} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((c) => <StatBadge key={c.label} label={c.label} value={c.value} />)}
      </div>

      {prediction && (
        <div className="mt-6">
          <div className="text-sm text-slate-500 mb-1">Prediction</div>
          <div className="flex gap-3">
            <StatBadge label="Mental" value={prediction.MentalHealthScore?.toFixed(1)} tone="info" />
            <StatBadge label="Physical" value={prediction.PhysicalHealthScore?.toFixed(1)} tone="info" />
            <StatBadge label="Predicted Risk" value={prediction.PredictedRisk} />
          </div>
        </div>
      )}
    </div>
  );
}
