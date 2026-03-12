import express from 'express';
import { Hostel } from '../models/Hostel.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const hostelsRouter = express.Router();

// GET /api/hostels?academicYearId=
hostelsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const items = await Hostel.find({ academicYearId }).sort({ name: 1 }).lean();
  res.json({ items: items.map((i) => ({ ...i, _id: String(i._id), academicYearId: String(i.academicYearId) })) });
});

// POST /api/hostels
hostelsRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  const hostelType = (b.hostelType || '').toString().toLowerCase();
  const address = (b.address || '').toString().trim();
  if (!name || !hostelType) {
    return res.status(400).json({ message: 'name and hostelType are required' });
  }
  if (!['boys', 'girls', 'staff'].includes(hostelType)) {
    return res.status(400).json({ message: 'hostelType must be boys, girls, or staff' });
  }
  if (!address) {
    return res.status(400).json({ message: 'address is required' });
  }

  const doc = await Hostel.create({
    academicYearId,
    name,
    hostelType,
    address,
    note: (b.note || '').toString().trim(),
  });
  res.status(201).json({ ...doc.toObject(), _id: String(doc._id), academicYearId: String(doc.academicYearId) });
});

// PUT /api/hostels/:id
hostelsRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await Hostel.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const b = req.body || {};
  if (b.name != null) doc.name = (b.name || '').toString().trim();
  if (b.hostelType != null) {
    const ht = (b.hostelType || '').toString().toLowerCase();
    if (['boys', 'girls', 'staff'].includes(ht)) doc.hostelType = ht;
  }
  if (b.address != null) doc.address = (b.address || '').toString().trim();
  if (b.note != null) doc.note = (b.note || '').toString().trim();

  await doc.save();
  res.json({ ...doc.toObject(), _id: String(doc._id), academicYearId: String(doc.academicYearId) });
});

// DELETE /api/hostels/:id
hostelsRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await Hostel.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  await Hostel.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
