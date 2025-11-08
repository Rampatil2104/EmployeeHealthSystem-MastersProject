import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { getCorrelationMatrix } from "../../services/api";

export default function CorrelationHeatmap() {
  const [fields, setFields] = useState([]);
  const [matrix, setMatrix] = useState([]);

  useEffect(() => {
    getCorrelationMatrix().then(({ data }) => {
      setFields(data.fields);
      setMatrix(data.matrix);
    });
  }, []);

  if (!fields.length) return <div className="text-slate-400">No data</div>;

  return (
    <div className="h-[360px]">
      <Plot
        data={[{
          z: matrix, x: fields, y: fields,
          type: "heatmap",
          colorscale: "RdBu",
          reversescale: true,
          zmin: -1, zmax: 1,
          hovertemplate: "%{y} ↔ %{x}: %{z:.2f}<extra></extra>",
        }]}
        layout={{
          margin: { l: 90, r: 10, t: 10, b: 50 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          xaxis: { tickangle: -30 },
          yaxis: { autorange: "reversed" },
        }}
        config={{ displayModeBar: false, responsive: true }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
