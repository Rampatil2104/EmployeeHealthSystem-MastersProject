import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { getWellnessByDept } from "../../services/api";
import { PALETTE, axisStyle, gridStyle } from "../theme";

export default function WellnessStackedByDept() {
  const [rows, setRows] = useState([]);
  useEffect(() => { getWellnessByDept().then(({ data }) => setRows(data)); }, []);

  return (
    <div className="h-[360px]">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 8 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="department" interval={0} angle={-25} textAnchor="end" height={60} tick={axisStyle} />
          <YAxis domain={[0, 1]} tick={axisStyle} tickFormatter={(v) => v.toFixed(1)} width={40} />
          <Tooltip formatter={(v) => v.toFixed(2)} />
          <Legend />
          <Bar dataKey="sleep"   name="Sleep"     stackId="a" fill={PALETTE.stack[0]} />
          <Bar dataKey="workLife" name="Work-Life" stackId="a" fill={PALETTE.stack[1]} />
          <Bar dataKey="stress"  name="Stress"    stackId="a" fill={PALETTE.stack[2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
