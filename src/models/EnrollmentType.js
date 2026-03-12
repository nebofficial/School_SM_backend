import mongoose from 'mongoose';

const EnrollmentTypeSchema = new mongoose.Schema(
  {
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

EnrollmentTypeSchema.index({ academicYearId: 1, name: 1 }, { unique: true });

export const EnrollmentType =
  mongoose.models.EnrollmentType || mongoose.model('EnrollmentType', EnrollmentTypeSchema);
