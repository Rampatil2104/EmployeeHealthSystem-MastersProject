// frontend/src/charts/summary/StressSleepWLB3D.jsx
import { useEffect, useMemo, useState } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";
import { get3DStressSleepWLB } from "../../services/api";
const Plot = createPlotlyComponent(Plotly);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mean = (a)=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
const std  = (a,m)=>Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/Math.max(1,a.length));
const q = (arr, p) => {
  const s = [...arr].sort((a,b)=>a-b); if (!s.length) return 0;
  const i = clamp((s.length-1)*p, 0, s.length-1); const lo = Math.floor(i), hi = Math.ceil(i);
  return lo===hi ? s[lo] : s[lo] + (s[hi]-s[lo])*(i-lo);
};

export default function StressSleepWLB3D() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    get3DStressSleepWLB()
      .then(({ data }) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e?.message || "Failed to load"));
  }, []);

  const data = useMemo(() => {
    const pts = rows.filter(d =>
      Number.isFinite(d?.sleep) && Number.isFinite(d?.wlb) &&
      Number.isFinite(d?.stress) && Number.isFinite(d?.size)
    );
    if (!pts.length) return null;

    // axis z-scores for spread
    const sx = pts.map(d=>d.sleep), sy = pts.map(d=>d.wlb), sz = pts.map(d=>d.stress);
    const mx = mean(sx), my = mean(sy), mz = mean(sz);
    const sdx = Math.max(1e-6, std(sx, mx)), sdy = Math.max(1e-6, std(sy, my)), sdz = Math.max(1e-6, std(sz, mz));

    // jitter
    const jitter = () => (Math.random()-0.5) * 0.08; // ~±0.04

    // robust color scaling for high risk share
    const c = pts.map(d => d.highShare ?? 0);
    const cmin = q(c, 0.1);
    const cmax = q(c, 0.9);

    const x = pts.map(d => ((d.sleep - mx) / sdx) + jitter());
    const y = pts.map(d => ((d.wlb   - my) / sdy) + jitter());
    const z = pts.map(d => ((d.stress- mz) / sdz) + jitter());
    const size = pts.map(d => clamp(Math.sqrt(d.size)*2 + 6, 8, 28)); // 8–28 px
    const color = c.map(v => clamp((v - cmin) / Math.max(1e-6, cmax - cmin), 0, 1));
    const text = pts.map(d => `${d.dept}<br>n=${d.size}<br>High=${((d.highShare??0)*100).toFixed(1)}%`);

    return { x, y, z, size, color, text };
  }, [rows]);

  if (err) return <div className="text-rose-500 text-sm">{err}</div>;
  if (!data) return <div className="text-slate-400 text-sm">No data</div>;

  return (
    <div className="h-[360px]">
      <Plot
        data={[{
          type: "scatter3d",
          mode: "markers",
          x: data.x, y: data.y, z: data.z, text: data.text,
          hovertemplate: "%{text}<extra></extra>",
          marker: {
            size: data.size,
            color: data.color,
            colorscale: "Portland",
            cmin: 0, cmax: 1, reversescale: false,
            opacity: 0.85, line: { width: 0.6, color: "rgba(0,0,0,0.25)" },
            colorbar: { title: "% High-Risk", ticksuffix: "%", thickness: 10 },
          },
        }]}
        layout={{
          margin: { l: 0, r: 0, t: 6, b: 0 },
          paper_bgcolor: "rgba(0,0,0,0)",
          showlegend: false,
          scene: {
            xaxis: { title: "Sleep (z)", gridcolor: "#e5e7eb", zerolinecolor: "#cbd5e1" },
            yaxis: { title: "Work-Life (z)", gridcolor: "#e5e7eb", zerolinecolor: "#cbd5e1" },
            zaxis: { title: "Stress (z)", gridcolor: "#e5e7eb", zerolinecolor: "#cbd5e1" },
            camera: { eye: { x: 1.6, y: 1.6, z: 0.9 } },
          },
        }}
        config={{ displayModeBar: false, responsive: true }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
