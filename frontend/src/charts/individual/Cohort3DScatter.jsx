import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * Cohort3DScatter
 * Props: { employee, cohort }
 * x = WorkLife (0–1), y = Stress (0–1), size = Sleep (0–1), color = Risk
 * Highlights the selected employee.
 */
export default function Cohort3DScatter({ employee, cohort = [] }) {
  if (!employee || cohort.length === 0) {
    return (
      <div className="h-[260px] grid place-content-center text-gray-400">
        Select a row →
      </div>
    );
  }

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const clamp01 = (v) => Math.max(0, Math.min(1, v ?? 0));
  const norm = (v, kind) => {
    const x = num(v);
    if (x == null) return 0;
    if (kind === "sleep") return clamp01(x / 9);
    if (kind === "percent") return clamp01(x > 1 ? x / 100 : x);
    if (x <= 1) return clamp01(x);
    if (x <= 5) return clamp01(x / 5);
    if (x <= 10) return clamp01(x / 10);
    return clamp01(x / 100);
  };

  const toPoint = (row) => {
    const x = norm(row["WorkLifeBalance"] ?? row.WorkLifeBalance, "percent");
    const y = norm(row["Stress Level"] ?? row.Stress, "percent");
    const z = norm(row["Sleep Duration"] ?? row.SleepDuration, "sleep");
    const risk = (row.RiskCategory2 || "").toString();
    return {
      x,
      y,
      z: 40 + Math.round(z * 80), // bubble size 40..120
      risk,
      id: row._id ?? row.EmployeeID,
      role: row.JobRole,
    };
  };

  const pts = cohort.map(toPoint);
  const me = toPoint(employee);

  // Basic color by risk
  const riskColor = (r) =>
    r === "High" ? "#EF4444" : r === "Medium" ? "#F59E0B" : "#22C55E";

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" name="WorkLife" domain={[0, 1]} tickFormatter={(t) => (t * 100).toFixed(0) + "%"} />
          <YAxis type="number" dataKey="y" name="Stress" domain={[0, 1]} tickFormatter={(t) => (t * 100).toFixed(0) + "%"} />
          <ZAxis type="number" dataKey="z" range={[40, 120]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(val, name) => {
              if (name === "x") return [(val * 100).toFixed(0) + "%", "WorkLife"];
              if (name === "y") return [(val * 100).toFixed(0) + "%", "Stress"];
              if (name === "z") return [Math.round(val), "Sleep (bubble size)"];
              if (name === "risk") return [val, "Risk"];
              return [val, name];
            }}
            labelFormatter={(_, p) => (p && p.length ? `Role: ${p[0].payload.role}` : "")}
          />
          <Legend />
          {/* Cohort points */}
          <Scatter name="Cohort" data={pts} fill="#94A3B8" />
          {/* Highlighted employee */}
          <Scatter
            name="Selected"
            data={[me]}
            fill={riskColor(employee.RiskCategory2)}
            shape={(props) => (
              <circle
                cx={props.cx}
                cy={props.cy}
                r={Math.sqrt(props.size)} // recharts passes size→area-ish; keep big
                fill={riskColor(employee.RiskCategory2)}
                stroke="#111827"
                strokeWidth={2}
              />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
