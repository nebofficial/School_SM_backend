import mongoose from 'mongoose';

const WarehouseSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

WarehouseSchema.index({ academicYearId: 1, name: 1 }, { unique: true });

export const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);
