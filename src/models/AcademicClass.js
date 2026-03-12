import mongoose from 'mongoose';

const AcademicClassSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

AcademicClassSchema.index(
  { academicYearId: 1, name: 1 },
  { unique: true }
);

export const AcademicClass =
  mongoose.models.AcademicClass ||
  mongoose.model('AcademicClass', AcademicClassSchema);

