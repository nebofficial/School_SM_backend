import mongoose from 'mongoose';

const AcademicYearSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['current', 'active', 'draft', 'deleted'],
      default: 'draft',
      index: true
    }
  },
  { timestamps: true }
);

AcademicYearSchema.index({ name: 1 }, { unique: true });

export const AcademicYear =
  mongoose.models.AcademicYear || mongoose.model('AcademicYear', AcademicYearSchema);

