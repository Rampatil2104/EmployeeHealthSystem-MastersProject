import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, ScatterChart, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Scatter } from "recharts";
import { getStressVsWLB } from "../../services/api";
import Loader from "../../components/Loader";
import ErrorBox from "../../components/ErrorBox";

const tt = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md bg-white/95 dark:bg-slate-800 px-3 py-2 text-sm shadow">
      <div className="font-medium">{p.role}</div>
      <div className="text-slate-600 dark:text-slate-300">Avg WLB: {(p.x).toFixed(2)}</div>
      <div className="text-slate-600 dark:text-slate-300">Avg Stress: {(p.y).toFixed(2)}</div>
      <div className="text-slate-600 dark:text-slate-300">Headcount: {p.z}</div>
    </div>
  );
};

export default function StressWLBubble({ dept = "All", risk = "All" }) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const params = {};
        if (dept && dept !== "All") params.department = dept;
        if (risk && risk !== "All") params.risk = risk;
        // Expected API: [{ jobRole, avgWLB, avgStress, count }]
        const res = await getStressVsWLB(params);
        if (!ok) return;
        const data = (res.data || []).map(d => ({
          role: d.jobRole,
          x: d.avgWLB ?? 0,
          y: d.avgStress ?? 0,
          z: Math.max(1, d.count ?? 1)
        }));
        setRows(data);
      } catch (e) { setErr(e); }
      finally { setLoading(false); }
    })();
    return () => (ok = false);
  }, [dept, risk]);

  const zDomain = useMemo(() => {
    if (!rows?.length) return [1, 10];
    const zVals = rows.map(r => r.z);
    return [Math.min(...zVals), Math.max(...zVals)];
  }, [rows]);

  if (loading) return <Loader />;
  if (err) return <ErrorBox error={err} />;
  if (!rows?.length) return <div className="text-slate-400">No data</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 16, bottom: 16, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name="WLB" domain={[0, 1]} tickFormatter={(v)=>v.toFixed(1)} />
        <YAxis type="number" dataKey="y" name="Stress" domain={[0, 1]} tickFormatter={(v)=>v.toFixed(1)} />
        <ZAxis type="number" dataKey="z" range={[60, 240]} domain={zDomain} />
        <Tooltip content={tt} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={rows} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
