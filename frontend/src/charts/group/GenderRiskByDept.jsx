import { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { getGenderRiskByDept } from '../../services/api';
import ChartCard from '../../components/ChartCard';
import ErrorBox from '../../components/ErrorBox';
import Loader from '../../components/Loader';

const COLORS = { Male: '#60a5fa', Female: '#f472b6' };
const RISKS = ['Low','Medium','High'];

export default function GenderRiskByDept() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(null);

  useEffect(() => {
    setRows(null); setErr(null);
    getGenderRiskByDept().then(({data}) => setRows(data)).catch(e => setErr(e));
  }, []);

  const data = useMemo(() => {
    if (!rows) return null;
    const depts = [...new Set(rows.map(r => r.department))];
    return depts.map(d => {
      const recs = rows.filter(r => r.department === d);
      const obj = { department: d };
      for (const g of ['Male','Female']) {
        for (const r of RISKS) {
          const hit = recs.find(x => x.gender === g && x.risk === r);
          obj[`${g}_${r}`] = hit ? hit.count : 0;
        }
      }
      return obj;
    });
  }, [rows]);

  return (
    <ChartCard title="Gender & Risk by Department" subtitle="Grouped bars, color by gender (stacked by risk)">
      {err && <ErrorBox error={err} />}
      {!data ? <Loader/> : (
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="department" angle={-25} height={70} textAnchor="end"/>
              <YAxis tickFormatter={(v)=>`${Math.round(v*100)}%`}/>
              <Tooltip formatter={(v)=>Number(v).toLocaleString()} />
              <Legend />
              {['Male','Female'].map(g => (
                <Bar key={g} stackId={g} dataKey={`${g}_Low`} fill={COLORS[g]} opacity={0.4} />
              ))}
              {['Male','Female'].map(g => (
                <Bar key={g+'M'} stackId={g} dataKey={`${g}_Medium`} fill={COLORS[g]} opacity={0.7} />
              ))}
              {['Male','Female'].map(g => (
                <Bar key={g+'H'} stackId={g} dataKey={`${g}_High`} fill={COLORS[g]} opacity={1} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
