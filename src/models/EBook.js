import mongoose from 'mongoose';

const EBookSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicClass' },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSubject' },
    name: { type: String, required: true, trim: true },
    edition: { type: String, trim: true, default: '' },
    author: { type: String, trim: true, default: '' },
    language: { type: String, trim: true, default: '' },
    coverImageUrl: { type: String, trim: true, default: '' },
    documentUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

EBookSchema.index({ academicYearId: 1 });
EBookSchema.index({ classId: 1, subjectId: 1 });

export const EBook = mongoose.models.EBook || mongoose.model('EBook', EBookSchema);
