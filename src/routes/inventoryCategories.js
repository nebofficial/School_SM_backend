import express from 'express';
import { InventoryCategory } from '../models/InventoryCategory.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const inventoryCategoriesRouter = express.Router();

// GET ?academicYearId=&type=inventory|asset (optional type filter)
inventoryCategoriesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const filter = { academicYearId };
  if (req.query.type === 'inventory' || req.query.type === 'asset') filter.type = req.query.type;
  const items = await InventoryCategory.find(filter).sort({ name: 1 }).lean();
  res.json({ items: items.map((i) => ({ ...i, _id: String(i._id), academicYearId: String(i.academicYearId) })) });
});

inventoryCategoriesRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  const type = (b.type || 'inventory').toString().toLowerCase();
  if (!name) return res.status(400).json({ message: 'name is required' });
  if (!['inventory', 'asset'].includes(type)) return res.status(400).json({ message: 'type must be inventory or asset' });
  const existing = await InventoryCategory.findOne({ academicYearId, type, name });
  if (existing) return res.status(400).json({ message: 'Category name already exists for this type' });
  const doc = await InventoryCategory.create({ academicYearId, name, type });
  res.status(201).json({ ...doc.toObject(), _id: String(doc._id), academicYearId: String(doc.academicYearId) });
});

inventoryCategoriesRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await InventoryCategory.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const b = req.body || {};
  if (b.name != null) doc.name = (b.name || '').toString().trim();
  if (b.type != null) {
    const t = (b.type || '').toString().toLowerCase();
    if (['inventory', 'asset'].includes(t)) doc.type = t;
  }
  await doc.save();
  res.json({ ...doc.toObject(), _id: String(doc._id), academicYearId: String(doc.academicYearId) });
});

inventoryCategoriesRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await InventoryCategory.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await InventoryCategory.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
