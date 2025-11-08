import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { getEducationHealth } from '../../services/api';
import ChartCard from '../../components/ChartCard';
import Loader from '../../components/Loader';
import ErrorBox from '../../components/ErrorBox';

export default function EducationHealthBox() {
  const [series, setSeries] = useState(null); const [err, setErr] = useState(null);

  useEffect(() => {
    setSeries(null); setErr(null);
    getEducationHealth().then(({data}) => setSeries(data)).catch(e => setErr(e));
  }, []);

  return (
    <ChartCard title="Education Field vs Overall Health (Box Plot)" subtitle="Distribution of OverallHealthScore2">
      {err && <ErrorBox error={err}/> }
      {!series ? <Loader/> : (
        <Plot
          useResizeHandler
          style={{ width:'100%', height:'360px' }}
          config={{ displayModeBar:false }}
          data={series.map(s => ({
            type: 'box',
            name: s.field,
            y: s.values,
            boxmean: true
          }))}
          layout={{ margin: { t: 10, r: 10, l: 40, b: 80 }, xaxis: { tickangle: -25 } }}
        />
      )}
    </ChartCard>
  );
}
