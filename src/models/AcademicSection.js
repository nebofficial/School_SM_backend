import mongoose from 'mongoose';

const AcademicSectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicClass',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

AcademicSectionSchema.index(
  { academicYearId: 1, classId: 1, name: 1 },
  { unique: true }
);

export const AcademicSection =
  mongoose.models.AcademicSection ||
  mongoose.model('AcademicSection', AcademicSectionSchema);

