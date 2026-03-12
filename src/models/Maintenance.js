import mongoose from 'mongoose';

const MaintenanceSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    cost: { type: Number, default: 0, min: 0 },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export const Maintenance = mongoose.models.Maintenance || mongoose.model('Maintenance', MaintenanceSchema);
