import express from 'express';
import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { StockLedger } from '../models/StockLedger.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const salesRouter = express.Router();

salesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const items = await Sale.find({ academicYearId })
    .populate('productId', 'name productCode warehouseId')
    .sort({ date: -1 })
    .lean();
  const withWarehouse = await Promise.all(
    items.map(async (i) => {
      const product = i.productId;
      const warehouseId = product?.warehouseId;
      return {
        ...i,
        _id: String(i._id),
        academicYearId: String(i.academicYearId),
        productId: product ? String(product._id) : null,
        productName: product?.name,
        productCode: product?.productCode,
        warehouseId: warehouseId ? String(warehouseId) : null,
      };
    })
  );
  res.json({ items: withWarehouse });
});

salesRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const productId = b.productId || null;
  const quantity = Number(b.quantity);
  const unitPrice = Number(b.unitPrice);
  const discount = Number(b.discount) || 0;
  const paidAmount = Number(b.paidAmount) ?? 0;
  const paymentStatus = (b.paymentStatus || 'due').toString().toLowerCase();
  if (!productId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return res.status(400).json({ message: 'productId, quantity (>0), unitPrice (>=0) are required' });
  }
  if (!['paid', 'partial', 'due'].includes(paymentStatus)) {
    return res.status(400).json({ message: 'paymentStatus must be paid, partial, or due' });
  }
  const product = await Product.findOne({ _id: productId, academicYearId }).lean();
  if (!product) return res.status(400).json({ message: 'Product not found' });
  const warehouseId = product.warehouseId;
  const ledger = await StockLedger.findOne({ academicYearId, productId, warehouseId });
  if (!ledger || ledger.currentQty < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }
  const total = Math.max(0, quantity * unitPrice - discount);
  const date = b.date ? new Date(b.date) : new Date();
  const doc = await Sale.create({
    academicYearId,
    productId,
    quantity,
    unitPrice,
    discount,
    total,
    paidAmount,
    paymentStatus,
    date,
    customerName: (b.customerName || '').toString().trim(),
    note: (b.note || '').toString().trim(),
  });
  await StockLedger.updateOne(
    { academicYearId, productId, warehouseId },
    { $inc: { currentQty: -quantity } }
  );
  const populated = await Sale.findById(doc._id).populate('productId', 'name productCode').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    productId: String(populated.productId._id),
    productName: populated.productId?.name,
    productCode: populated.productId?.productCode,
  });
});

salesRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Sale.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const product = await Product.findOne({ _id: doc.productId, academicYearId }).lean();
  if (product) {
    await StockLedger.updateOne(
      { academicYearId, productId: doc.productId, warehouseId: product.warehouseId },
      { $inc: { currentQty: doc.quantity } }
    );
  }
  await Sale.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
