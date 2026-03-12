import express from 'express';
import { Vendor } from '../models/Vendor.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const vendorsRouter = express.Router();

vendorsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const items = await Vendor.find({ academicYearId }).sort({ name: 1 }).lean();
  res.json({ items: items.map((i) => ({ ...i, _id: String(i._id), academicYearId: String(i.academicYearId) })) });
});

vendorsRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  if (!name) return res.status(400).json({ message: 'name is required' });
  const doc = await Vendor.create({
    academicYearId,
    name,
    contactName: (b.contactName || '').toString().trim(),
    email: (b.email || '').toString().trim(),
    phone: (b.phone || '').toString().trim(),
    address: (b.address || '').toString().trim(),
    note: (b.note || '').toString().trim(),
  });
  res.status(201).json({ ...doc.toObject(), _id: String(doc._id), academicYearId: String(doc.academicYearId) });
});

vendorsRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Vendor.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const b = req.body || {};
  if (b.name != null) doc.name = (b.name || '').toString().trim();
  if (b.contactName != null) doc.contactName = (b.contactName || '').toString().trim();
  if (b.email != null) doc.email = (b.email || '').toString().trim();
  if (b.phone != null) doc.phone = (b.phone || '').toString().trim();
  if (b.address != null) doc.address = (b.address || '').toString().trim();
  if (b.note != null) doc.note = (b.note || '').toString().trim();
  await doc.save();
  res.json({ ...doc.toObject(), _id: String(doc._id), academicYearId: String(doc.academicYearId) });
});

vendorsRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Vendor.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await Vendor.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
