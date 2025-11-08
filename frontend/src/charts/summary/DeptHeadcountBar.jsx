import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getDepartmentSizes } from "../../services/api";
import { PALETTE, axisStyle, gridStyle, num } from "../theme";

export default function DeptHeadcountBar({ limit = 12 }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { getDepartmentSizes().then(({ data }) => setRows(data.slice(0, limit))); }, [limit]);

  return (
    <div className="h-[320px]">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 12, right: 12, bottom: 4, left: 8 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="department" interval={0} angle={-25} textAnchor="end" height={60} tick={axisStyle} />
          <YAxis width={56} tick={axisStyle} tickFormatter={num} />
          <Tooltip formatter={(v) => num(v)} />
          <Bar dataKey="count" fill={PALETTE.bars[0]} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
