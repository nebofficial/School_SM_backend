import express from 'express';
import { Asset } from '../models/Asset.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const assetsRouter = express.Router();

assetsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const items = await Asset.find({ academicYearId })
    .populate('categoryId', 'name')
    .populate('storeId', 'name')
    .sort({ productCode: 1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      categoryId: i.categoryId ? String(i.categoryId._id) : null,
      categoryName: i.categoryId?.name,
      storeId: i.storeId ? String(i.storeId._id) : null,
      storeName: i.storeId?.name,
    })),
  });
});

assetsRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  const productCode = (b.productCode || '').toString().trim();
  const categoryId = b.categoryId || null;
  const storeId = b.storeId || null;
  const type = (b.type || 'non-consumable').toString().toLowerCase();
  if (!name || !productCode || !categoryId || !storeId) {
    return res.status(400).json({ message: 'name, productCode, categoryId, storeId are required' });
  }
  if (!['consumable', 'non-consumable'].includes(type)) {
    return res.status(400).json({ message: 'type must be consumable or non-consumable' });
  }
  const existing = await Asset.findOne({ academicYearId, productCode });
  if (existing) return res.status(400).json({ message: 'Asset code already exists' });
  const doc = await Asset.create({
    academicYearId,
    categoryId,
    name,
    productCode,
    type,
    storeId,
    quantity: Number(b.quantity) || 0,
    note: (b.note || '').toString().trim(),
  });
  const populated = await Asset.findById(doc._id).populate('categoryId', 'name').populate('storeId', 'name').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    categoryId: String(populated.categoryId._id),
    categoryName: populated.categoryId?.name,
    storeId: String(populated.storeId._id),
    storeName: populated.storeId?.name,
  });
});

assetsRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Asset.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const b = req.body || {};
  if (b.name != null) doc.name = (b.name || '').toString().trim();
  if (b.productCode != null) {
    const code = (b.productCode || '').toString().trim();
    if (code) {
      const existing = await Asset.findOne({ academicYearId, productCode: code, _id: { $ne: doc._id } });
      if (existing) return res.status(400).json({ message: 'Asset code already exists' });
      doc.productCode = code;
    }
  }
  if (b.type != null) {
    const t = (b.type || '').toString().toLowerCase();
    if (['consumable', 'non-consumable'].includes(t)) doc.type = t;
  }
  if (b.categoryId != null) doc.categoryId = b.categoryId;
  if (b.storeId != null) doc.storeId = b.storeId;
  if (b.quantity != null && Number.isFinite(Number(b.quantity))) doc.quantity = Math.max(0, Number(b.quantity));
  if (b.note != null) doc.note = (b.note || '').toString().trim();
  await doc.save();
  const populated = await Asset.findById(doc._id).populate('categoryId', 'name').populate('storeId', 'name').lean();
  res.json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    categoryId: String(populated.categoryId._id),
    categoryName: populated.categoryId?.name,
    storeId: String(populated.storeId._id),
    storeName: populated.storeId?.name,
  });
});

assetsRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Asset.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await Asset.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
