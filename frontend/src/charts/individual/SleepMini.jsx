import React, { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

// Small, deterministic pseudo-random so the sparkline
// looks varied per employee but doesn’t change on refresh.
function seededRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Color helpers
function sleepColor(h) {
  if (h >= 7) return "#16a34a";   // green
  if (h >= 6) return "#f59e0b";   // amber
  return "#ef4444";               // red
}

export default function SleepMini({ emp }) {
  // Pull raw values from the selected employee row
  const sleepHrs = Number(emp?.["Sleep Duration"]) || 0;           // hours per night
  const sleepQual = Number(emp?.["Quality of Sleep"]) || 0;        // 0–1 (dataset)

  // Build a tiny 7-day series around the base hours (± ~0.8 h jitter)
  const data = useMemo(() => {
    const base = sleepHrs || 6.2; // fallback
    const id = (emp?.EmployeeID || "0").replace(/\D/g, "") || "1";
    const seedNum = Number(id.slice(-4)); // use last 4 digits for repeatability
    return Array.from({ length: 7 }, (_, i) => {
      // deterministic wiggle
      const wiggle = (seededRand(seedNum + i) - 0.5) * 1.6; // ~±0.8 h
      const h = clamp(base + wiggle, 4.0, 9.5);
      return { day: ["M","T","W","T","F","S","S"][i], hrs: Number(h.toFixed(2)) };
    });
  }, [sleepHrs, emp?.EmployeeID]);

  const avg = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((s, d) => s + d.hrs, 0) / data.length;
  }, [data]);

  return (
    <div className="rounded-xl border p-4 h-[260px] dark:border-gray-700 flex flex-col">
      <div className="text-sm font-medium mb-2">Sleep (mini)</div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sleepFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} />
            <YAxis hide domain={[4, 10]} />
            <Tooltip
              formatter={(v) => [`${v} h`, "Sleep"]}
              labelStyle={{ color: "#6b7280" }}
              contentStyle={{ borderRadius: 12 }}
            />
            <Area
              type="monotone"
              dataKey="hrs"
              stroke="#3b82f6"
              fill="url(#sleepFill)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Kpi
          label="Avg Hours"
          value={`${avg.toFixed(1)} h`}
          color={sleepColor(avg)}
        />
        <Kpi
          label="Quality"
          value={`${Math.round(clamp(sleepQual, 0, 1) * 100)}%`}
          color={sleepColor( (sleepQual * 10) || avg )} // green-ish if quality high
        />
      </div>
    </div>
  );
}

function Kpi({ label, value, color = "#6b7280" }) {
  return (
    <div className="rounded-lg border px-3 py-2 dark:border-gray-700">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}
