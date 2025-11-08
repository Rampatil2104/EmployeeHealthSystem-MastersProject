export const PALETTE = {
  high:   '#ef4444',
  med:    '#f59e0b',
  low:    '#22c55e',
  gray:   '#94a3b8',
  grid:   '#e5e7eb',
  axis:   '#64748b',
  bars:   ['#6366f1','#06b6d4','#10b981','#f59e0b','#f97316','#ef4444','#84cc16','#a855f7'],
  stack:  ['#60a5fa', '#22c55e', '#f59e0b'], // sleep, worklife, stress
};

export const axisStyle = { stroke: PALETTE.axis, fontSize: 12 };
export const gridStyle = { stroke: PALETTE.grid, strokeDasharray: '3 3' };

export const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
export const num = (v) => Intl.NumberFormat('en').format(v);
