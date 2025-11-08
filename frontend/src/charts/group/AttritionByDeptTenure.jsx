import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { getAttritionByTenure } from '../../services/api';
import ChartCard from '../../components/ChartCard';
import ErrorBox from '../../components/ErrorBox';
import Loader from '../../components/Loader';

export default function AttritionByDeptTenure() {
  const [grid, setGrid] = useState(null); const [err, setErr] = useState(null);

  useEffect(() => {
    setGrid(null); setErr(null);
    getAttritionByTenure().then(({data}) => setGrid(data)).catch(e => setErr(e));
  }, []);

  return (
    <ChartCard title="Attrition by Department & Tenure" subtitle="Color = attrition rate (left / total)">
      {err && <ErrorBox error={err} />}
      {!grid ? <Loader/> : (
        <Plot
          useResizeHandler
          style={{width:'100%', height:'360px'}}
          config={{displayModeBar:false}}
          data={[{
            type: 'heatmap',
            x: grid.x, y: grid.y, z: grid.z,
            colorscale: 'YlOrRd', reversescale: false, zmin: 0, zmax: 1
          }]}
          layout={{ margin: { t: 10, r: 10, l: 10, b: 80 }, yaxis: { automargin:true }, xaxis:{ tickangle: -35 } }}
        />
      )}
    </ChartCard>
  );
}
