import { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getDeptRadar } from '../../services/api';
import ChartCard from '../../components/ChartCard';
import Loader from '../../components/Loader';
import ErrorBox from '../../components/ErrorBox';

const KEYS = [
  { key: 'stress', label: 'Stress' },
  { key: 'workLife', label: 'WorkLife' },
  { key: 'jobSat', label: 'JobSat' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'sleepQuality', label: 'SleepQual' },
];

export default function DeptWellnessRadar({ department='All' }) {
  const [data, setData] = useState(null); const [err, setErr] = useState(null);

  useEffect(() => {
    setData(null); setErr(null);
    getDeptRadar({ department }).then(({data}) => {
      const rows = KEYS.map(k => ({ metric: k.label, value: data[k.key] ?? 0 }));
      setData(rows);
    }).catch(e => setErr(e));
  }, [department]);

  return (
    <ChartCard title="Department Wellness Radar" subtitle="Averages on 0–1 scale">
      {err && <ErrorBox error={err}/>}
      {!data ? <Loader/> : (
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={30} domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Radar name={department} dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
