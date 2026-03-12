import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema(
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
    type: { type: String, required: true, enum: ['consumable', 'non-consumable'], default: 'non-consumable', index: true },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetStore',
      required: true,
      index: true,
    },
    quantity: { type: Number, default: 0, min: 0 },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

AssetSchema.index({ academicYearId: 1, productCode: 1 }, { unique: true });

export const Asset = mongoose.models.Asset || mongoose.model('Asset', AssetSchema);
