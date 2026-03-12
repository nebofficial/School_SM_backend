import express from 'express';
import { Maintenance } from '../models/Maintenance.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const maintenanceRouter = express.Router();

maintenanceRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const assetId = req.query.assetId;
  const filter = { academicYearId };
  if (assetId) filter.assetId = assetId;
  const items = await Maintenance.find(filter)
    .populate('assetId', 'name productCode')
    .sort({ date: -1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      assetId: i.assetId ? String(i.assetId._id) : null,
      assetName: i.assetId?.name,
      assetCode: i.assetId?.productCode,
    })),
  });
});

maintenanceRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const assetId = b.assetId || null;
  const date = b.date ? new Date(b.date) : new Date();
  const description = (b.description || '').toString().trim();
  if (!assetId || !description) return res.status(400).json({ message: 'assetId and description are required' });
  const doc = await Maintenance.create({
    academicYearId,
    assetId,
    date,
    description,
    cost: Number(b.cost) || 0,
    note: (b.note || '').toString().trim(),
  });
  const populated = await Maintenance.findById(doc._id).populate('assetId', 'name productCode').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    assetId: String(populated.assetId._id),
    assetName: populated.assetId?.name,
    assetCode: populated.assetId?.productCode,
  });
});

maintenanceRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Maintenance.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const b = req.body || {};
  if (b.date != null) doc.date = new Date(b.date);
  if (b.description != null) doc.description = (b.description || '').toString().trim();
  if (b.cost != null && Number.isFinite(Number(b.cost))) doc.cost = Math.max(0, Number(b.cost));
  if (b.note != null) doc.note = (b.note || '').toString().trim();
  await doc.save();
  const populated = await Maintenance.findById(doc._id).populate('assetId', 'name productCode').lean();
  res.json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    assetId: String(populated.assetId._id),
    assetName: populated.assetId?.name,
    assetCode: populated.assetId?.productCode,
  });
});

maintenanceRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Maintenance.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await Maintenance.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
