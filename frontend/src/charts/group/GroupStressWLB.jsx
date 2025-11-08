import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { getStressVsWLB } from '../../services/api';
import ChartCard from '../../components/ChartCard';
import ErrorBox from '../../components/ErrorBox';
import Loader from '../../components/Loader';

export default function GroupStressWLB({ department='All', risk='All' }) {
  const [data, setData] = useState(null); const [err, setErr] = useState(null);
  useEffect(() => {
    setData(null); setErr(null);
    getStressVsWLB({ department, risk })
      .then(({data}) => setData(data))
      .catch(e => setErr(e));
  }, [department, risk]);

  return (
    <ChartCard title="Job Role: Stress vs Work-Life Balance" subtitle="Filtered by Department / Risk">
      {err && <ErrorBox error={err} />}
      {!data ? <Loader/> : (
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="role" angle={-25} height={70} textAnchor="end" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="stress" name="Avg Stress" fill="#ef4444" opacity={0.85} />
              <Bar dataKey="wlb" name="Avg WorkLifeBalance" fill="#22c55e" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
