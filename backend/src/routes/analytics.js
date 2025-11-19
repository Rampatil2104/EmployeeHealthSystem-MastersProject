// backend/src/routes/analytics.js
import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();
const col = () => mongoose.connection.db.collection('employees');

// ---------- helpers ----------
const num = v => {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};

const mean = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const std = (arr, m) => {
  if (!arr.length) return 0;
  const v = arr.reduce((s,x)=>s+(x-m)*(x-m),0)/arr.length;
  return Math.sqrt(v);
};
const pearson = (x, y) => {
  const n = Math.min(x.length, y.length);
  if (!n) return 0;
  const mx = mean(x), my = mean(y);
  const sx = std(x, mx), sy = std(y, my);
  if (sx === 0 || sy === 0) return 0;
  let cov = 0;
  for (let i=0; i<n; i++) cov += (x[i]-mx)*(y[i]-my);
  cov /= n;
  return Math.max(-1, Math.min(1, cov/(sx*sy)));
};

// ========== existing endpoints you already had ==========

// Risk donut
router.get('/risk-distribution', async (req, res) => {
  const data = await col().aggregate([
    { $group: { _id: '$RiskCategory2', n: { $sum: 1 } } },
    { $project: { _id: 0, label: '$_id', value: '$n' } },
    { $sort: { label: 1 } }
  ]).toArray();
  res.json(data);
});

// Department headcount bar
router.get('/department-sizes', async (req, res) => {
  const data = await col().aggregate([
    { $group: { _id: '$Department', count: { $sum: 1 } } },
    { $project: { _id: 0, department: '$_id', count: 1 } },
    { $sort: { count: -1 } },
    { $limit: 12 }
  ]).toArray();
  res.json(data);
});

// ========== NEW endpoints your charts expect ==========

// 1) Stacked bars: Sleep + WorkLife + Stress by Department
router.get('/wellness-by-dept', async (req, res) => {
  const data = await col().aggregate([
    { $group: {
        _id: '$Department',
        sleep: { $avg: '$Sleep Duration' },
        wlb:   { $avg: '$WorkLifeBalance' },
        stress:{ $avg: '$Stress Level' }
    }},
    { $project: {
        _id: 0,
        department: '$_id',
        sleep: { $round: ['$sleep', 3] },
        workLife: { $round: ['$wlb', 3] },
        stress: { $round: ['$stress', 3] }
    }},
    { $sort: { department: 1 } }
  ]).toArray();
  res.json(data);
});

// 2) Bubble chart: Stress vs WLB by JobRole (size=headcount)
// Optional filters: ?department=IT&risk=High (use "All" or omit for no filter)
router.get('/stress-wlb', async (req, res) => {
  const { department, risk } = req.query;
  const match = {};
  if (department && department !== 'All') match.Department = department;
  if (risk && risk !== 'All') match.RiskCategory2 = risk;

  const data = await col().aggregate([
    { $match: match },
    { $group: {
        _id: '$JobRole',
        stress: { $avg: '$Stress Level' },
        wlb:    { $avg: '$WorkLifeBalance' },
        size:   { $sum: 1 }
    }},
    { $project: {
        _id: 0,
        role: '$_id',
        stress: { $round: ['$stress', 3] },
        wlb: { $round: ['$wlb', 3] },
        size: 1
    }},
    { $sort: { size: -1 } },
    { $limit: 30 }
  ]).toArray();

  res.json(data);
});

// 3) Correlation heatmap for selected metrics
// GET /api/analytics/correlations?fields=Sleep%20Duration,Stress%20Level,WorkLifeBalance,AvgSteps,AvgCalories,VeryActiveMinutes,SedentaryMinutes,JobSatisfaction
router.get('/correlations', async (req, res) => {
  const defaultFields = [
    'Sleep Duration','Quality of Sleep','Stress Level',
    'WorkLifeBalance','JobSatisfaction',
    'Daily Steps','AvgSteps','AvgCalories',
    'VeryActiveMinutes','SedentaryMinutes',
    'Heart Rate','Blood Pressure'
  ];
  const fields = (req.query.fields?.split(',') || defaultFields).map(s => s.trim()).filter(Boolean);
  const projection = Object.fromEntries(fields.map(f => [f, 1]));

  // Pull a sample (we only have 2.5k rows; take all)
  const docs = await col().find({}, { projection }).limit(5000).toArray();

  // Build vectors
  const vectors = Object.fromEntries(fields.map(f => [f, []]));
  for (const d of docs) {
    for (const f of fields) {
      const v = num(d[f]);
      if (v !== null) vectors[f].push(v);
    }
  }

  // Compute pairwise Pearson
  const matrix = [];
  for (let i=0; i<fields.length; i++) {
    const row = [];
    for (let j=0; j<fields.length; j++) {
      row.push(pearson(vectors[fields[i]], vectors[fields[j]]));
    }
    matrix.push(row);
  }

  res.json({ fields, matrix });
});

// 4) Radar: overall averages (0–1) for a few wellness dimensions
router.get('/wellness-radar', async (req, res) => {
  const agg = await col().aggregate([
    { $group: {
        _id: null,
        stress: { $avg: '$Stress Level' },
        wlb:    { $avg: '$WorkLifeBalance' },
        jobsat: { $avg: '$JobSatisfaction' },
        sleep:  { $avg: '$Sleep Duration' },
        qsleep: { $avg: '$Quality of Sleep' }
    }},
    { $project: {
        _id: 0,
        stress: { $round: ['$stress', 3] },
        workLife: { $round: ['$wlb', 3] },
        jobSat: { $round: ['$jobsat', 3] },
        sleep: { $round: ['$sleep', 3] },
        sleepQuality: { $round: ['$qsleep', 3] }
    }}
  ]).toArray();

  res.json(agg[0] || {
    stress: 0, workLife: 0, jobSat: 0, sleep: 0, sleepQuality: 0
  });
});
// 5) 3D: Sleep (x) vs WorkLife (y) vs Stress (z) by Department
router.get('/stress-sleep-wlb-3d', async (req, res) => {
  const data = await col().aggregate([
    { $group: {
        _id: '$Department',
        stress: { $avg: '$Stress Level' },
        sleep:  { $avg: '$Sleep Duration' },
        wlb:    { $avg: '$WorkLifeBalance' },
        size:   { $sum: 1 },
        high:   { $sum: { $cond: [{ $eq: ['$RiskCategory2','High'] }, 1, 0] } }
    }},
    { $project: {
        _id: 0,
        dept: '$_id',
        stress: { $round: ['$stress', 3] },
        sleep:  { $round: ['$sleep', 3] },
        wlb:    { $round: ['$wlb', 3] },
        size: 1,
        highShare: { $round: [{ $divide: ['$high','$size'] }, 3] }
    }},
    { $sort: { size: -1 } }
  ]).toArray();

  res.json(data);
});

// --- GROUP VIEW ENDPOINTS ---

// A) Department → Risk (Sankey)
router.get('/department-risk-sankey', async (_req, res) => {
  const rows = await col().aggregate([
    { $group: { _id: { dept: '$Department', risk: '$RiskCategory2' }, n: { $sum: 1 } } },
    { $project: { _id: 0, department: '$_id.dept', risk: '$_id.risk', value: '$n' } },
  ]).toArray();

  const deptNames = [...new Set(rows.map(r => r.department))];
  const riskNames = [...new Set(rows.map(r => r.risk))];

  const nodes = [
    ...deptNames.map(d => ({ name: d })),                // 0..D-1
    ...riskNames.map(r => ({ name: r }))                 // D..D+R-1
  ];

  const D = deptNames.length;
  const links = rows.map(r => ({
    source: deptNames.indexOf(r.department),
    target: D + riskNames.indexOf(r.risk),
    value: r.value
  }));

  res.json({ nodes, links });
});

// B) Attrition by Department & Tenure buckets (heatmap)
router.get('/attrition-tenure', async (_req, res) => {
  const buckets = [
    { name: '<1y',  cond: { $lt: [ '$YearsAtCompany', 1 ] } },
    { name: '1-3y', cond: { $and: [ { $gte: [ '$YearsAtCompany', 1 ] }, { $lt: [ '$YearsAtCompany', 3 ] } ] } },
    { name: '3-5y', cond: { $and: [ { $gte: [ '$YearsAtCompany', 3 ] }, { $lt: [ '$YearsAtCompany', 5 ] } ] } },
    { name: '5+y',  cond: { $gte: [ '$YearsAtCompany', 5 ] } },
  ];

  // count attrition yes per dept/tenure
  const data = await col().aggregate([
    {
      $project: {
        Department: 1, Attrition: 1, YearsAtCompany: 1,
        bucket: {
          $switch: {
            branches: buckets.map(b => ({ case: b.cond, then: b.name })),
            default: '5+y'
          }
        }
      }
    },
    { $group: {
      _id: { dept: '$Department', bucket: '$bucket' },
      total: { $sum: 1 },
      left:  { $sum: { $cond: [{ $eq: ['$Attrition','Yes'] }, 1, 0] } }
    }},
    { $project: {
      _id: 0, department: '$_id.dept', bucket: '$_id.bucket',
      rate: { $cond: [{ $gt: ['$total',0] }, { $divide: ['$left', '$total'] }, 0] }
    }},
  ]).toArray();

  const depts = [...new Set(data.map(d => d.department))].sort();
  const y = buckets.map(b => b.name);
  const z = y.map(b =>
    depts.map(d => {
      const rec = data.find(x => x.department === d && x.bucket === b);
      return rec ? Number(rec.rate.toFixed(3)) : 0;
    })
  );

  res.json({ x: depts, y, z }); // suitable for Plotly heatmap
});

// C) Gender & Risk by Department (long rows)
router.get('/gender-risk', async (_req, res) => {
  const rows = await col().aggregate([
    { $group: {
      _id: { dept: '$Department', gender: '$Gender', risk: '$RiskCategory2' },
      n: { $sum: 1 }
    }},
    { $project: { _id: 0, department: '$_id.dept', gender: '$_id.gender', risk: '$_id.risk', count: '$n' } },
    { $sort: { department: 1, gender: 1, risk: 1 } }
  ]).toArray();
  res.json(rows);
});

// D) Department wellness radar (averages)
router.get('/department-radar', async (req, res) => {
  const { department } = req.query;
  const match = department && department !== 'All' ? { Department: department } : {};
  const agg = await col().aggregate([
    { $match: match },
    { $group: {
      _id: null,
      stress: { $avg: '$Stress Level' },
      wlb:    { $avg: '$WorkLifeBalance' },
      jobsat: { $avg: '$JobSatisfaction' },
      sleep:  { $avg: '$Sleep Duration' },
      qsleep: { $avg: '$Quality of Sleep' }
    }},
    { $project: {
      _id: 0,
      stress: { $round: ['$stress', 3] },
      workLife: { $round: ['$wlb', 3] },
      jobSat: { $round: ['$jobsat', 3] },
      sleep: { $round: ['$sleep', 3] },
      sleepQuality: { $round: ['$qsleep', 3] }
    }}
  ]).toArray();

  res.json(agg[0] || { stress:0, workLife:0, jobSat:0, sleep:0, sleepQuality:0 });
});

// E) Education field vs health score (box)
router.get('/education-health', async (_req, res) => {
  const docs = await col().aggregate([
    { $project: { EducationField: 1, OverallHealthScore2: 1 } }
  ]).toArray();
  const groups = {};
  for (const d of docs) {
    const k = d.EducationField || 'Unknown';
    if (!groups[k]) groups[k] = [];
    if (typeof d.OverallHealthScore2 === 'number') groups[k].push(d.OverallHealthScore2);
  }
  const series = Object.entries(groups).map(([field, values]) => ({ field, values }));
  res.json(series);
});

// GET /api/analytics/dept-risk-sankey?department=All&risk=All
router.get('/dept-risk-sankey', async (req, res) => {
  const { department, risk } = req.query;
  const match = {};
  if (department && department !== 'All') match.Department = department;
  if (risk && risk !== 'All') match.RiskCategory2 = risk;

  // aggregate counts
  const rows = await col().aggregate([
    { $match: match },
    { $group: { _id: { dept: '$Department', risk: '$RiskCategory2' }, n: { $sum: 1 } } },
    { $project: { _id: 0, dept: '$_id.dept', risk: '$_id.risk', value: '$n' } },
    { $match: { value: { $gt: 0 } } },
    { $sort: { dept: 1, risk: 1 } }
  ]).toArray();

  // build unique node list (departments + risks)
  const deptNames = Array.from(new Set(rows.map(r => r.dept)));
  const riskNames = Array.from(new Set(rows.map(r => r.risk))); // typically Low/Medium/High

  const nodes = [
    ...deptNames.map(name => ({ name })),                 // 0..deptNames.length-1
    ...riskNames.map(name => ({ name }))                  // dept offset .. end
  ];

  const offset = deptNames.length;
  const links = rows.map(r => ({
    source: deptNames.indexOf(r.dept),           // numeric index
    target: offset + riskNames.indexOf(r.risk),  // numeric index into risk nodes
    value: r.value
  }));

  res.json({ nodes, links });
});

router.get('/ranges', async (_req, res) => {
  const fields = ['AvgSteps','VeryActiveMinutes','SedentaryMinutes','AvgCalories',
                  'RestingHeartRate','SystolicBP','DiastolicBP','Sleep Duration'];
  const pipe = fields.map(f => ({ 
    $group: { _id: null, 
      [`${f}_min`]: { $min: `$${f}` }, 
      [`${f}_max`]: { $max: `$${f}` } 
    } 
  }));
  const flat = await mongoose.connection.db
    .collection('employees')
    .aggregate([
      {
        $group: {
          _id: null,
          AvgSteps_min: { $min: '$AvgSteps' }, AvgSteps_max: { $max: '$AvgSteps' },
          VeryActiveMinutes_min: { $min: '$VeryActiveMinutes' }, VeryActiveMinutes_max: { $max: '$VeryActiveMinutes' },
          SedentaryMinutes_min: { $min: '$SedentaryMinutes' }, SedentaryMinutes_max: { $max: '$SedentaryMinutes' },
          AvgCalories_min: { $min: '$AvgCalories' }, AvgCalories_max: { $max: '$AvgCalories' },
          RestingHeartRate_min: { $min: '$RestingHeartRate' }, RestingHeartRate_max: { $max: '$RestingHeartRate' },
          SystolicBP_min: { $min: '$SystolicBP' }, SystolicBP_max: { $max: '$SystolicBP' },
          DiastolicBP_min: { $min: '$DiastolicBP' }, DiastolicBP_max: { $max: '$DiastolicBP' },
          Sleep_min: { $min: '$Sleep Duration' }, Sleep_max: { $max: '$Sleep Duration' },
        }
      },
      { $project: { _id: 0 } }
    ])
    .toArray();

  res.json(flat[0] || {});
});

router.get('/ping', (req, res) => res.json({ ok: true, router: 'analytics' }));
export default router;
