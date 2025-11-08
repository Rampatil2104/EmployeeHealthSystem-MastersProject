import RiskDonut from "../charts/summary/RiskDonut";
import DeptHeadcountBar from "../charts/summary/DeptHeadcountBar";
import WellnessStackedByDept from "../charts/summary/WellnessStackedByDept";
import StressSleepWLB3D from "../charts/summary/StressSleepWLB3D";
import CorrelationHeatmap from "../charts/summary/CorrelationHeatmap";
import WellnessRadar from "../charts/summary/WellnessRadar";

export default function SummaryView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Summary View</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4">
          <div className="font-semibold mb-2">Risk Distribution</div>
          <RiskDonut />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4">
          <div className="font-semibold mb-2">Employee count by department</div>
          <DeptHeadcountBar limit={12} />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4">
          <div className="font-semibold mb-1">Wellness Breakdown by Department (stacked)</div>
          <div className="text-xs text-slate-500 mb-2">Sleep + Work-Life + Stress levels</div>
          <WellnessStackedByDept />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4">
          <div className="font-semibold mb-1">Sleep × Work-Life × Stress (3D)</div>
          <div className="text-xs text-slate-500 mb-2">Size = headcount, Color = % High-Risk</div>
          <StressSleepWLB3D />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4">
          <div className="font-semibold mb-1">Correlation Heatmap</div>
          <div className="text-xs text-slate-500 mb-2">Selected health & HR features (−1…1)</div>
          <CorrelationHeatmap />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4">
          <div className="font-semibold mb-1">Wellness Radar</div>
          <div className="text-xs text-slate-500 mb-2">Overall average levels (0–1)</div>
          <WellnessRadar />
        </div>
      </div>
    </div>
  );
}
