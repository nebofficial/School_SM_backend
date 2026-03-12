import express from 'express';
import { Purchase } from '../models/Purchase.js';
import { Product } from '../models/Product.js';
import { StockLedger } from '../models/StockLedger.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const purchasesRouter = express.Router();

purchasesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const items = await Purchase.find({ academicYearId })
    .populate('supplierId', 'supplier contactName')
    .populate('productId', 'name productCode')
    .populate('warehouseId', 'name')
    .sort({ date: -1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      supplierId: i.supplierId ? String(i.supplierId._id) : null,
      supplierName: i.supplierId?.supplier,
      productId: i.productId ? String(i.productId._id) : null,
      productName: i.productId?.name,
      productCode: i.productId?.productCode,
      warehouseId: i.warehouseId ? String(i.warehouseId._id) : null,
      warehouseName: i.warehouseId?.name,
    })),
  });
});

purchasesRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const supplierId = b.supplierId || null;
  const productId = b.productId || null;
  const warehouseId = b.warehouseId || null;
  const quantity = Number(b.quantity);
  const unitPrice = Number(b.unitPrice);
  if (!supplierId || !productId || !warehouseId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return res.status(400).json({ message: 'supplierId, productId, warehouseId, quantity (>0), unitPrice (>=0) are required' });
  }
  const product = await Product.findOne({ _id: productId, academicYearId });
  if (!product) return res.status(400).json({ message: 'Product not found' });
  if (String(product.warehouseId) !== String(warehouseId)) {
    return res.status(400).json({ message: 'Warehouse must match product warehouse' });
  }
  const total = quantity * unitPrice;
  const date = b.date ? new Date(b.date) : new Date();
  const doc = await Purchase.create({
    academicYearId,
    supplierId,
    productId,
    warehouseId,
    quantity,
    unitPrice,
    total,
    date,
    note: (b.note || '').toString().trim(),
  });
  await StockLedger.findOneAndUpdate(
    { academicYearId, productId, warehouseId },
    { $inc: { currentQty: quantity } }
  );
  const populated = await Purchase.findById(doc._id)
    .populate('supplierId', 'supplier')
    .populate('productId', 'name productCode')
    .populate('warehouseId', 'name')
    .lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    supplierId: String(populated.supplierId._id),
    supplierName: populated.supplierId?.supplier,
    productId: String(populated.productId._id),
    productName: populated.productId?.name,
    warehouseId: String(populated.warehouseId._id),
    warehouseName: populated.warehouseId?.name,
  });
});

purchasesRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Purchase.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await StockLedger.findOneAndUpdate(
    { academicYearId, productId: doc.productId, warehouseId: doc.warehouseId },
    { $inc: { currentQty: -doc.quantity } }
  );
  await Purchase.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
