// --------------------------------------
// Employee Health System API (server.js)
// --------------------------------------
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';

import employeesRouter from './src/routes/employees.js';
import analyticsRouter from './src/routes/analytics.js';
import predictRouter from './src/routes/predict.js';

const app = express();

// --- MIDDLEWARES ---
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// --- DATABASE ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/employeehealth';
await mongoose.connect(MONGO_URI, { dbName: 'employeehealth' });
console.log(`✅ MongoDB connected → ${MONGO_URI} (employees)`);

// --- HEALTH CHECK ---
app.get('/api/health', async (_req, res) => {
  const count = await mongoose.connection.db.collection('employees').countDocuments();
  res.json({ ok: true, db: 'employeehealth', collection: 'employees', count });
});

// --- ROUTES ---
app.use('/api/employees', employeesRouter);

// tiny logger to prove analytics router is actually hit
app.use('/api/analytics', (req, _res, next) => {
  console.log('Analytics route hit:', req.method, req.url);
  next();
}, analyticsRouter);

app.use('/api/predict', predictRouter);

// --- 404 / ERROR ---
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));
app.use((err, _req, res, _next) => {
  console.error('💥 API Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// --- START ---
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`🚀 API running at: http://localhost:${PORT}`));
