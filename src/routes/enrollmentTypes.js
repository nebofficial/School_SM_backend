import express from 'express';
import { EnrollmentType } from '../models/EnrollmentType.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const enrollmentTypesRouter = express.Router();

function toPlain(item) {
  if (!item) return null;
  const o = typeof item.toObject === 'function' ? item.toObject() : item;
  return {
    _id: String(o._id),
    academicYearId: o.academicYearId ? String(o.academicYearId) : null,
    name: o.name,
    createdAt: o.createdAt ? o.createdAt.toISOString() : null,
    updatedAt: o.updatedAt ? o.updatedAt.toISOString() : null,
  };
}

// GET /api/enrollment-types?academicYearId=...
enrollmentTypesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const items = await EnrollmentType.find({ academicYearId }).sort({ name: 1 }).lean();
  res.setHeader('Content-Type', 'application/json');
  res.json({
    items: items.map((i) => ({
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      name: i.name,
      createdAt: i.createdAt ? i.createdAt.toISOString() : null,
      updatedAt: i.updatedAt ? i.updatedAt.toISOString() : null,
    })),
  });
});

// POST /api/enrollment-types
enrollmentTypesRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const { name } = req.body || {};
  const trimmed = (name ?? '').toString().trim();
  if (!trimmed) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ message: 'name is required' });
  }
  const existing = await EnrollmentType.findOne({ academicYearId, name: trimmed });
  if (existing) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ message: 'Enrollment type with this name already exists' });
  }
  const doc = await EnrollmentType.create({ academicYearId, name: trimmed });
  res.setHeader('Content-Type', 'application/json');
  res.status(201).json(toPlain(doc));
});

// PUT /api/enrollment-types/:id
enrollmentTypesRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const { id } = req.params;
  const { name } = req.body || {};
  const trimmed = (name ?? '').toString().trim();
  if (!trimmed) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ message: 'name is required' });
  }
  const doc = await EnrollmentType.findOne({ _id: id, academicYearId });
  if (!doc) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(404).json({ message: 'Not found' });
  }
  const existing = await EnrollmentType.findOne({ academicYearId, name: trimmed, _id: { $ne: id } });
  if (existing) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ message: 'Enrollment type with this name already exists' });
  }
  doc.name = trimmed;
  await doc.save();
  res.setHeader('Content-Type', 'application/json');
  res.json(toPlain(doc));
});

// DELETE /api/enrollment-types/:id
enrollmentTypesRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const { id } = req.params;
  const doc = await EnrollmentType.findOne({ _id: id, academicYearId });
  if (!doc) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(404).json({ message: 'Not found' });
  }
  await EnrollmentType.findByIdAndDelete(id);
  res.status(204).send();
});
