// frontend/src/charts/individual/ActivityMini.jsx
import React from "react";
import ChartCard from "../../components/ChartCard";

// Tune these caps if your dataset uses different scales
const MAX_STEPS_GOAL = 12000;     // daily steps goal
const MAX_VERY_ACTIVE_MIN = 120;  // cap: vigorous minutes/day
const MAX_SEDENTARY_MIN = 720;    // cap: sedentary minutes/day (12h)

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function ActivityMini({ picked }) {
  const activity = React.useMemo(() => {
    if (!picked) return null;

    // Dataset stores normalized values (0..1). Convert to real-ish units.
    const ds = num(picked["Daily Steps"]);        // normalized
    const as = num(picked["AvgSteps"]);           // normalized
    const va = num(picked["VeryActiveMinutes"]);  // normalized
    const sm = num(picked["SedentaryMinutes"]);   // normalized

    const stepsToday   = Math.round(ds * MAX_STEPS_GOAL);
    const avgSteps     = Math.round(as * MAX_STEPS_GOAL);
    const veryActiveMin = Math.round(va * MAX_VERY_ACTIVE_MIN);
    const sedentaryMin  = Math.round(sm * MAX_SEDENTARY_MIN);

    const stepsPctOfGoal = Math.max(
      0,
      Math.min(100, Math.round((stepsToday / MAX_STEPS_GOAL) * 100))
    );

    return { stepsToday, avgSteps, veryActiveMin, sedentaryMin, stepsPctOfGoal };
  }, [picked]);

  return (
    <ChartCard title="Activity (mini)">
      {!picked ? (
        <div className="h-full grid place-content-center text-gray-500">
          Select a row →
        </div>
      ) : (
        <div className="space-y-4">
          {/* small vibe bar (no data binding — just a subtle visual) */}
          <div className="h-20 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 grid place-content-center">
            <div className="text-xs text-orange-700 dark:text-orange-300">
              Daily activity snapshot
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border p-3 dark:border-gray-700">
              <div className="text-gray-500 text-xs">Steps (today)</div>
              <div className="text-xl font-semibold">
                {activity?.stepsToday?.toLocaleString() ?? "-"}
              </div>
              <div className="text-xs text-gray-500">
                {activity
                  ? `${activity.stepsPctOfGoal}% of ${MAX_STEPS_GOAL.toLocaleString()} goal`
                  : ""}
              </div>
            </div>

            <div className="rounded-xl border p-3 dark:border-gray-700">
              <div className="text-gray-500 text-xs">Very Active</div>
              <div className="text-xl font-semibold">
                {activity?.veryActiveMin ?? "-"} min
              </div>
              <div className="text-xs text-gray-500">intense movement</div>
            </div>

            <div className="rounded-xl border p-3 dark:border-gray-700">
              <div className="text-gray-500 text-xs">Sedentary</div>
              <div className="text-xl font-semibold">
                {activity?.sedentaryMin ?? "-"} min
              </div>
              <div className="text-xs text-gray-500">sitting / low movement</div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Avg steps:{" "}
            <span className="font-medium">
              {activity?.avgSteps?.toLocaleString() ?? "-"}
            </span>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
