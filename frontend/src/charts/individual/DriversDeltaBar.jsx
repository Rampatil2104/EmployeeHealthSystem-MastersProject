import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";

/**
 * DriversDeltaBar
 * Compares YOUR score to COHORT mean for each driver and shows the DELTA.
 * Positive (green) = you above cohort; Negative (red) = you below cohort.
 */
export default function DriversDeltaBar({ employee, cohort = [] }) {
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
    if (kind === "sleep") return clamp01(x / 9);           // hours ~0..9
    if (kind === "percent") return clamp01(x > 1 ? x/100 : x);
    if (x <= 1) return clamp01(x);
    if (x <= 5) return clamp01(x/5);
    if (x <= 10) return clamp01(x/10);
    return clamp01(x/100);
  };
  const mean = (arr) => (arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0);

  const fields = [
    { key: "Stress",    pick: d => d["Stress Level"] ?? d.Stress,               kind: "percent" },
    { key: "WorkLife",  pick: d => d["WorkLifeBalance"] ?? d.WorkLifeBalance,   kind: "percent" },
    { key: "JobSat",    pick: d => d["JobSatisfaction"] ?? d.JobSatisfaction,   kind: "percent" },
    { key: "Sleep",     pick: d => d["Sleep Duration"] ?? d.SleepDuration,      kind: "sleep"   },
    { key: "SleepQual", pick: d => d["Quality of Sleep"] ?? d.QualityOfSleep,   kind: "percent" },
  ];

  const data = fields.map(({ key, pick, kind }) => {
    const you = norm(pick(employee), kind);
    const cohortVals = cohort.map(r => norm(pick(r), kind)).filter(Number.isFinite);
    const avg = clamp01(mean(cohortVals));
    return {
      key,
      delta: +(you - avg).toFixed(3),
      you,
      cohort: avg,
    };
  });

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="key" />
          <YAxis domain={[-1, 1]} tickFormatter={(t) => `${Math.round(t * 100)}%`} />
          <Tooltip formatter={(v, name) =>
            name === "delta"
              ? [`${(v*100).toFixed(0)}%`, "Δ vs Cohort"]
              : [`${(v*100).toFixed(0)}%`, name]
          } />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Bar dataKey="delta" name="Δ vs Cohort" radius={4}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.delta >= 0 ? "#22C55E" : "#EF4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="text-xs text-slate-500 mt-1">
        Positive bars mean the employee is above cohort on that driver; negative means below.
      </div>
    </div>
  );
}
