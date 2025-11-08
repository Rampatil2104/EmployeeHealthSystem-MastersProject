import { useEffect, useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { getWellnessRadar } from "../../services/api";

export default function WellnessRadar() {
  const [v, setV] = useState(null);
  useEffect(() => { getWellnessRadar().then(({ data }) => setV(data)); }, []);
  if (!v) return <div className="text-slate-400">No data</div>;

  const rows = [
    { metric: "Stress",    value: v.stress },
    { metric: "WorkLife",  value: v.workLife },
    { metric: "JobSat",    value: v.jobSat },
    { metric: "Sleep",     value: v.sleep },
    { metric: "SleepQual", value: v.sleepQuality },
  ];

  return (
    <div className="h-[360px]">
      <ResponsiveContainer>
        <RadarChart data={rows} outerRadius={110}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <Radar name="value" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
