import mongoose from 'mongoose';

const AssetStoreSchema = new mongoose.Schema(
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

AssetStoreSchema.index({ academicYearId: 1, name: 1 }, { unique: true });

export const AssetStore = mongoose.models.AssetStore || mongoose.model('AssetStore', AssetStoreSchema);
