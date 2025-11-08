import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getRiskDistribution } from "../../services/api";
import { PALETTE, num } from "../theme";

export default function RiskDonut() {
  const [data, setData] = useState([]);
  useEffect(() => { getRiskDistribution().then(({ data }) => setData(data)); }, []);

  const colorFor = (label) =>
    label === "High" ? PALETTE.high : label === "Medium" ? PALETTE.med : PALETTE.low;

  return (
    <div className="h-[320px]">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={70} outerRadius={110} paddingAngle={2}>
            {data.map((d, i) => <Cell key={i} fill={colorFor(d.label)} />)}
          </Pie>
          <Tooltip formatter={(v) => num(v)} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
