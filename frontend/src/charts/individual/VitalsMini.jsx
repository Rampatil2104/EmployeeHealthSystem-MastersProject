import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from "recharts";

export default function VitalsMini({ emp }) {
  if (!emp) return <Empty />;

  // Use what’s available on the employee doc as “snapshot series”
  const data = [
    { k: "Heart Rate", v: num(emp["Heart Rate"]) * 100 },
    { k: "Blood Pressure", v: num(emp["Blood Pressure"]) * 100 },
    { k: "BMI", v: num(emp["BMI"]) * 100 },
  ];

  return (
    <Card>
      <Header title="Vitals (mini)" />
      <Spark data={data} />
      <Grid3
        items={[
          { label: "Heart Rate", value: fmtPct(emp["Heart Rate"]) },
          { label: "Blood Pressure", value: fmtPct(emp["Blood Pressure"]) },
          { label: "BMI", value: fmtPct(emp["BMI"]) },
        ]}
      />
    </Card>
  );
}

function num(x) { const n = Number(x); return Number.isFinite(n) ? n : 0; }
function fmtPct(x) { const n = num(x); return `${(n * 100).toFixed(0)}%`; }

function Empty(){ return <div className="h-full grid place-content-center text-gray-500">Select an employee ↑</div>; }

function Card({ children }) {
  return <div className="h-full rounded-xl border p-4 dark:border-gray-700">{children}</div>;
}
function Header({ title }) { return <div className="text-sm font-medium mb-2">{title}</div>; }
function Spark({ data }) {
  return (
    <div className="h-24 mb-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <YAxis hide domain={[0, 100]} />
          <Tooltip formatter={(v) => `${v.toFixed(0)}%`} />
          <Area type="monotone" dataKey="v" stroke="#60a5fa" fill="#93c5fd" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
function Grid3({ items }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg border p-2 text-center dark:border-gray-700">
          <div className="text-xs text-gray-500">{it.label}</div>
          <div className="text-lg font-semibold">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
