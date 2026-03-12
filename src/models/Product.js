import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryCategory',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    productCode: { type: String, required: true, trim: true },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

ProductSchema.index({ academicYearId: 1, productCode: 1 }, { unique: true });

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
