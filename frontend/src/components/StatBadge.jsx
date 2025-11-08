export default function StatBadge({ label, value, tone }) {
  const toneMap = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  };

  // auto tone for Risk
  let cls = toneMap.info;
  if (!tone && typeof value === "string") {
    if (value === "Low") cls = toneMap.success;
    else if (value === "Medium") cls = toneMap.warn;
    else if (value === "High") cls = toneMap.danger;
  } else if (tone) {
    cls = toneMap[tone] || toneMap.info;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      <span className="opacity-70">{label}</span>
      <span>{value}</span>
    </span>
  );
}
