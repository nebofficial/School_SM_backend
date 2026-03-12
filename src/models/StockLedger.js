import mongoose from 'mongoose';

// One document per productId + warehouseId. Quantity = current stock (opening + purchases - sales - issues).
const StockLedgerSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    openingQty: { type: Number, default: 0 },
    currentQty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

StockLedgerSchema.index({ academicYearId: 1, productId: 1, warehouseId: 1 }, { unique: true });

export const StockLedger = mongoose.models.StockLedger || mongoose.model('StockLedger', StockLedgerSchema);
