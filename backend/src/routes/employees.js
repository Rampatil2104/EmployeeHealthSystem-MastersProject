import { Router } from 'express';
import Employee from '../models/Employee.js';

const router = Router();

/**
 * GET /api/employees
 * Query: page, limit, department, risk, search
 */
router.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1'), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '100'), 1), 1000);

  const filter = {};
  if (req.query.department) filter.Department = req.query.department;
  if (req.query.risk) filter.RiskCategory2 = req.query.risk;
  if (req.query.search) {
    filter.$or = [
      { EmployeeID: new RegExp(req.query.search, 'i') },
      { Department: new RegExp(req.query.search, 'i') },
      { JobRole: new RegExp(req.query.search, 'i') }
    ];
  }

  const [items, total] = await Promise.all([
    Employee.find(filter).skip((page - 1) * limit).limit(limit).lean(),
    Employee.countDocuments(filter)
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

router.get('/:id', async (req, res) => {
  const emp = await Employee.findOne({ EmployeeID: req.params.id }).lean();
  if (!emp) return res.status(404).json({ error: 'Not found' });
  res.json(emp);
});

export default router;
