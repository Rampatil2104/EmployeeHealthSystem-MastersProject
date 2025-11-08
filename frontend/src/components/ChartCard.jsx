export default function ChartCard({ title, subtitle, children, height = 340 }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow p-4">
      <div className="mb-2">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>}
      </div>
      <div style={{ height }}>
        {children}
      </div>
    </div>
  );
}
