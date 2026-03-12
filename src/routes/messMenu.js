import express from 'express';
import { MessMenu } from '../models/MessMenu.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const messMenuRouter = express.Router();

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// GET /api/mess-menu?academicYearId=
messMenuRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const items = await MessMenu.find({ academicYearId }).sort({ dayOfWeek: 1, mealType: 1 }).lean();
  const mapped = items.map((i) => ({
    ...i,
    _id: String(i._id),
    academicYearId: String(i.academicYearId),
    dayName: DAYS[i.dayOfWeek] || `Day ${i.dayOfWeek}`,
  }));
  res.json({ items: mapped });
});

// POST /api/mess-menu
messMenuRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const dayOfWeek = parseInt(b.dayOfWeek, 10);
  const mealType = (b.mealType || '').toString().toLowerCase();
  const description = (b.description || '').toString().trim();

  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return res.status(400).json({ message: 'dayOfWeek must be 0-6' });
  }
  if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
    return res.status(400).json({ message: 'mealType must be breakfast, lunch, or dinner' });
  }

  const existing = await MessMenu.findOne({ academicYearId, dayOfWeek, mealType });
  if (existing) {
    return res.status(400).json({ message: 'Menu entry already exists for this day and meal' });
  }

  const doc = await MessMenu.create({
    academicYearId,
    dayOfWeek,
    mealType,
    description,
  });
  res.status(201).json({
    ...doc.toObject(),
    _id: String(doc._id),
    academicYearId: String(doc.academicYearId),
    dayName: DAYS[doc.dayOfWeek] || `Day ${doc.dayOfWeek}`,
  });
});

// PUT /api/mess-menu/:id
messMenuRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await MessMenu.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const b = req.body || {};
  if (b.description != null) doc.description = (b.description || '').toString().trim();

  await doc.save();
  res.json({
    ...doc.toObject(),
    _id: String(doc._id),
    academicYearId: String(doc.academicYearId),
    dayName: DAYS[doc.dayOfWeek] || `Day ${doc.dayOfWeek}`,
  });
});

// DELETE /api/mess-menu/:id
messMenuRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await MessMenu.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  await MessMenu.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
