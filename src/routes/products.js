import express from 'express';
import { Product } from '../models/Product.js';
import { StockLedger } from '../models/StockLedger.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const productsRouter = express.Router();

productsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const items = await Product.find({ academicYearId })
    .populate('categoryId', 'name type')
    .populate('warehouseId', 'name')
    .sort({ productCode: 1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      categoryId: i.categoryId ? String(i.categoryId._id) : null,
      categoryName: i.categoryId?.name,
      warehouseId: i.warehouseId ? String(i.warehouseId._id) : null,
      warehouseName: i.warehouseId?.name,
    })),
  });
});

productsRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  const productCode = (b.productCode || '').toString().trim();
  const categoryId = b.categoryId || null;
  const warehouseId = b.warehouseId || null;
  if (!name || !productCode || !categoryId || !warehouseId) {
    return res.status(400).json({ message: 'name, productCode, categoryId, warehouseId are required' });
  }
  const existing = await Product.findOne({ academicYearId, productCode });
  if (existing) return res.status(400).json({ message: 'Product code already exists' });
  const doc = await Product.create({
    academicYearId,
    categoryId,
    name,
    productCode,
    warehouseId,
    note: (b.note || '').toString().trim(),
  });
  await StockLedger.findOneAndUpdate(
    { academicYearId, productId: doc._id, warehouseId },
    { $setOnInsert: { academicYearId, productId: doc._id, warehouseId, openingQty: 0, currentQty: 0 } },
    { upsert: true }
  );
  const populated = await Product.findById(doc._id).populate('categoryId', 'name').populate('warehouseId', 'name').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    categoryId: String(populated.categoryId._id),
    categoryName: populated.categoryId?.name,
    warehouseId: String(populated.warehouseId._id),
    warehouseName: populated.warehouseId?.name,
  });
});

productsRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Product.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const b = req.body || {};
  if (b.name != null) doc.name = (b.name || '').toString().trim();
  if (b.productCode != null) {
    const code = (b.productCode || '').toString().trim();
    if (code) {
      const existing = await Product.findOne({ academicYearId, productCode: code, _id: { $ne: doc._id } });
      if (existing) return res.status(400).json({ message: 'Product code already exists' });
      doc.productCode = code;
    }
  }
  if (b.categoryId != null) doc.categoryId = b.categoryId;
  if (b.warehouseId != null) doc.warehouseId = b.warehouseId;
  if (b.note != null) doc.note = (b.note || '').toString().trim();
  await doc.save();
  const populated = await Product.findById(doc._id).populate('categoryId', 'name').populate('warehouseId', 'name').lean();
  res.json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    categoryId: String(populated.categoryId._id),
    categoryName: populated.categoryId?.name,
    warehouseId: String(populated.warehouseId._id),
    warehouseName: populated.warehouseId?.name,
  });
});

productsRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Product.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await StockLedger.deleteMany({ productId: doc._id });
  await Product.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
