import mongoose from 'mongoose';

// type: 'inventory' for consumable product categories, 'asset' for asset categories
const InventoryCategorySchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['inventory', 'asset'], default: 'inventory', index: true },
  },
  { timestamps: true }
);

InventoryCategorySchema.index({ academicYearId: 1, type: 1, name: 1 }, { unique: true });

export const InventoryCategory = mongoose.models.InventoryCategory || mongoose.model('InventoryCategory', InventoryCategorySchema);
