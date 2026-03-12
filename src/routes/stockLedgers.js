import express from 'express';
import { StockLedger } from '../models/StockLedger.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const stockLedgersRouter = express.Router();

// GET ?academicYearId=&lowStock=5 (optional: only return items where currentQty <= lowStock)
stockLedgersRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const filter = { academicYearId };
  const lowStock = req.query.lowStock != null ? Number(req.query.lowStock) : null;
  if (Number.isFinite(lowStock) && lowStock >= 0) filter.currentQty = { $lte: lowStock };
  const items = await StockLedger.find(filter)
    .populate('productId', 'name productCode categoryId warehouseId')
    .populate('warehouseId', 'name')
    .sort({ currentQty: 1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      productId: i.productId ? String(i.productId._id) : null,
      productName: i.productId?.name,
      productCode: i.productId?.productCode,
      warehouseId: i.warehouseId ? String(i.warehouseId._id) : null,
      warehouseName: i.warehouseId?.name,
    })),
  });
});
