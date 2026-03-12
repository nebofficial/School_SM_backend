import mongoose from 'mongoose';

const AcademicSubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    alias: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    shortCode: { type: String, trim: true, default: '' },
    type: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

AcademicSubjectSchema.index(
  { academicYearId: 1, name: 1 },
  { unique: true }
);

export const AcademicSubject =
  mongoose.models.AcademicSubject ||
  mongoose.model('AcademicSubject', AcademicSubjectSchema);

