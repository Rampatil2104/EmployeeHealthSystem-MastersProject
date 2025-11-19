import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";

/**
 * WellnessRadar
 * Props: { employee }
 * Shows 5 dimensions on a 0–1 scale (radar).
 */
export default function WellnessRadar({ employee }) {
  if (!employee) {
    return (
      <div className="h-[260px] grid place-content-center text-gray-400">
        Select a row →
      </div>
    );
  }

  // Defensive number parser
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // Normalize helper to 0..1 with a reasonable fallback range
  const clamp01 = (v) => Math.max(0, Math.min(1, v ?? 0));

  // Try to auto-normalize common fields:
  // - If value <= 1 → assume already [0,1]
  // - If value in [0,5] → divide by 5
  // - If value in [0,10] → divide by 10
  // - Sleep hours: cap at 9 (divide by 9)
  // - Quality often 0..1 or 0..100 → if >1, divide by 100
  const norm = (v, kind) => {
    const x = num(v);
    if (x == null) return 0;
    if (kind === "sleep") return clamp01(x / 9);
    if (kind === "percent") return clamp01(x > 1 ? x / 100 : x);
    if (x <= 1) return clamp01(x);
    if (x <= 5) return clamp01(x / 5);
    if (x <= 10) return clamp01(x / 10);
    return clamp01(x / 100); // last resort
  };

  const data = [
    {
      key: "Stress",
      value: norm(employee["Stress Level"] ?? employee.Stress, "percent"),
    },
    {
      key: "WorkLife",
      value: norm(employee["WorkLifeBalance"] ?? employee.WorkLifeBalance, "percent"),
    },
    {
      key: "JobSat",
      value: norm(employee["JobSatisfaction"] ?? employee.JobSatisfaction, "percent"),
    },
    {
      key: "Sleep",
      value: norm(employee["Sleep Duration"] ?? employee.SleepDuration, "sleep"),
    },
    {
      key: "SleepQual",
      value: norm(employee["Quality of Sleep"] ?? employee.QualityOfSleep, "percent"),
    },
  ];

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="key" />
          <PolarRadiusAxis angle={30} domain={[0, 1]} tickCount={6} />
          <Tooltip formatter={(v) => (Number.isFinite(v) ? (v * 100).toFixed(0) + "%" : "-")} />
          <Radar
            name="Wellness"
            dataKey="value"
            stroke="#6366F1"
            fill="#6366F1"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
