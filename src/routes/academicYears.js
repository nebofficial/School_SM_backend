import express from 'express';
import { AcademicYear } from '../models/AcademicYear.js';

export const academicYearsRouter = express.Router();

function clampStatus(status, includeDeleted) {
  if (!includeDeleted && status === 'deleted') return null;
  return status;
}

// GET /api/academic-years/current — must be before /:id so "current" is not treated as id
academicYearsRouter.get('/current', async (_req, res) => {
  const current = await AcademicYear.findOne({ status: 'current' }).lean();
  if (!current) return res.status(404).json({ message: 'No current academic year' });
  res.json(current);
});

// GET /api/academic-years?q=&status=&includeDeleted=true|false
academicYearsRouter.get('/', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const statusRaw = (req.query.status || '').toString().trim();
  const includeDeleted = (req.query.includeDeleted || 'false').toString() === 'true';

  const query = {};
  if (q) {
    query.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }
  if (statusRaw) {
    const status = clampStatus(statusRaw, includeDeleted);
    if (status) query.status = status;
  } else if (!includeDeleted) {
    query.status = { $ne: 'deleted' };
  }

  const items = await AcademicYear.find(query).sort({ startDate: -1 }).lean();
  res.json({ items });
});

// POST /api/academic-years
academicYearsRouter.post('/', async (req, res) => {
  const { name, startDate, endDate, status } = req.body || {};
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ message: 'name, startDate, endDate are required' });
  }

  const doc = await AcademicYear.create({
    name,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    status: status || 'draft'
  });

  // Ensure only one "current"
  if (doc.status === 'current') {
    await AcademicYear.updateMany({ _id: { $ne: doc._id }, status: 'current' }, { $set: { status: 'active' } });
  }

  res.status(201).json(doc.toObject());
});

// PUT /api/academic-years/:id
academicYearsRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, status } = req.body || {};

  const updated = await AcademicYear.findByIdAndUpdate(
    id,
    {
      ...(name != null ? { name } : {}),
      ...(startDate != null ? { startDate: new Date(startDate) } : {}),
      ...(endDate != null ? { endDate: new Date(endDate) } : {}),
      ...(status != null ? { status } : {})
    },
    { new: true, runValidators: true }
  );

  if (!updated) return res.status(404).json({ message: 'Not found' });

  if (updated.status === 'current') {
    await AcademicYear.updateMany({ _id: { $ne: updated._id }, status: 'current' }, { $set: { status: 'active' } });
  }

  res.json(updated.toObject());
});

// DELETE /api/academic-years/:id  (soft delete)
academicYearsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const updated = await AcademicYear.findByIdAndUpdate(id, { status: 'deleted' }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});

// POST /api/academic-years/:id/set-current
academicYearsRouter.post('/:id/set-current', async (req, res) => {
  const { id } = req.params;
  const current = await AcademicYear.findByIdAndUpdate(id, { status: 'current' }, { new: true });
  if (!current) return res.status(404).json({ message: 'Not found' });

  await AcademicYear.updateMany({ _id: { $ne: current._id }, status: 'current' }, { $set: { status: 'active' } });
  res.json(current.toObject());
});

