import express from 'express';
import { AssetStore } from '../models/AssetStore.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const assetStoresRouter = express.Router();

assetStoresRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const items = await AssetStore.find({ academicYearId }).sort({ name: 1 }).lean();
  res.json({ items: items.map((i) => ({ ...i, _id: String(i._id), academicYearId: String(i.academicYearId) })) });
});

assetStoresRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  if (!name) return res.status(400).json({ message: 'name is required' });
  const existing = await AssetStore.findOne({ academicYearId, name });
  if (existing) return res.status(400).json({ message: 'Store name already exists' });
  const doc = await AssetStore.create({
    academicYearId,
    name,
    note: (b.note || '').toString().trim(),
  });
  res.status(201).json({ ...doc.toObject(), _id: String(doc._id), academicYearId: String(doc.academicYearId) });
});

assetStoresRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await AssetStore.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const b = req.body || {};
  if (b.name != null) doc.name = (b.name || '').toString().trim();
  if (b.note != null) doc.note = (b.note || '').toString().trim();
  await doc.save();
  res.json({ ...doc.toObject(), _id: String(doc._id), academicYearId: String(doc.academicYearId) });
});

assetStoresRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await AssetStore.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await AssetStore.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
