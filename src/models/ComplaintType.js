import mongoose from 'mongoose';

const ComplaintTypeSchema = new mongoose.Schema(
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

ComplaintTypeSchema.index({ academicYearId: 1, name: 1 }, { unique: true });

export const ComplaintType = mongoose.models.ComplaintType || mongoose.model('ComplaintType', ComplaintTypeSchema);
