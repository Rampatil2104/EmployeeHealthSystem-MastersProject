import { useEffect, useState } from "react";
import { ResponsiveContainer, Sankey, Tooltip } from "recharts";

import api from "../../services/api";

const RISK_COLORS = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#ef4444",
};

export default function DeptRiskSankey({ department = "All", risk = "All" }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    api
      .get("/api/analytics/dept-risk-sankey", {
        params: { department, risk },
      })
      .then(({ data }) => {
        if (!alive) return;
        // Recharts likes { nodes:[{name}], links:[{source,target,value}] }
        setData(data);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.response?.data?.error || e.message);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [department, risk]);

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;
  if (err)     return <div className="p-6 text-red-600">Failed: {String(err)}</div>;
  if (!data?.nodes?.length || !data?.links?.length)
    return <div className="p-6 text-slate-500">No data</div>;

  // optional: color risks on right side
  const nodeColors = data.nodes.map(n => {
    return RISK_COLORS[n.name] || "#94a3b8"; // slate default for depts
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4">
      <div className="font-semibold mb-1">Department → Risk Sankey</div>
      <div className="text-xs text-slate-500 mb-3">
        Flow of employees from departments to risk categories
      </div>

      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <Sankey
            data={data}
            nodePadding={16}
            node={{ stroke: "#cbd5e1", strokeWidth: 1 }}
            link={{ strokeOpacity: 0.4 }}
            margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
            nodeStyle={(node, i) => ({
              fill: nodeColors[i] || "#94a3b8",
            })}
            linkStyle={(link) => ({
              // color links by target risk color
              stroke: nodeColors[link.target] || "#94a3b8",
            })}
          >
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                // link payload has source/target/value; node payload has depth/value/name
                if (typeof p.source === "number") {
                  const s = data.nodes[p.source]?.name;
                  const t = data.nodes[p.target]?.name;
                  return (
                    <div className="rounded bg-white/90 dark:bg-slate-800/90 px-3 py-2 text-sm shadow">
                      <div className="font-medium">{s} → {t}</div>
                      <div className="text-slate-600 dark:text-slate-300">Employees: {p.value}</div>
                    </div>
                  );
                }
                return (
                  <div className="rounded bg-white/90 dark:bg-slate-800/90 px-3 py-2 text-sm shadow">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-slate-600 dark:text-slate-300">Total: {p.value}</div>
                  </div>
                );
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
