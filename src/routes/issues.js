import express from 'express';
import { Issue } from '../models/Issue.js';
import { Product } from '../models/Product.js';
import { StockLedger } from '../models/StockLedger.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const issuesRouter = express.Router();

issuesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const items = await Issue.find({ academicYearId })
    .populate('productId', 'name productCode warehouseId')
    .sort({ date: -1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      productId: i.productId ? String(i.productId._id) : null,
      productName: i.productId?.name,
      productCode: i.productId?.productCode,
    })),
  });
});

issuesRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const productId = b.productId || null;
  const quantity = Number(b.quantity);
  const issuedTo = (b.issuedTo || '').toString().trim();
  if (!productId || !Number.isFinite(quantity) || quantity <= 0 || !issuedTo) {
    return res.status(400).json({ message: 'productId, quantity (>0), issuedTo are required' });
  }
  const product = await Product.findOne({ _id: productId, academicYearId }).lean();
  if (!product) return res.status(400).json({ message: 'Product not found' });
  const warehouseId = product.warehouseId;
  const ledger = await StockLedger.findOne({ academicYearId, productId, warehouseId });
  if (!ledger || ledger.currentQty < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }
  const date = b.date ? new Date(b.date) : new Date();
  const doc = await Issue.create({
    academicYearId,
    productId,
    quantity,
    issuedTo,
    date,
    note: (b.note || '').toString().trim(),
  });
  await StockLedger.updateOne(
    { academicYearId, productId, warehouseId },
    { $inc: { currentQty: -quantity } }
  );
  const populated = await Issue.findById(doc._id).populate('productId', 'name productCode').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    productId: String(populated.productId._id),
    productName: populated.productId?.name,
    productCode: populated.productId?.productCode,
  });
});

issuesRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Issue.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const product = await Product.findOne({ _id: doc.productId, academicYearId }).lean();
  if (product) {
    await StockLedger.updateOne(
      { academicYearId, productId: doc.productId, warehouseId: product.warehouseId },
      { $inc: { currentQty: doc.quantity } }
    );
  }
  await Issue.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
