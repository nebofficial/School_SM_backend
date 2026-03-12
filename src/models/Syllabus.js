import mongoose from 'mongoose';

const SyllabusSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSubject',
      required: true,
      index: true
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicClass',
      required: true,
      index: true
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    },
    chapters: [
      {
        title: { type: String, required: true },
        description: { type: String },
        order: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

SyllabusSchema.index({ academicYearId: 1, subjectId: 1, classId: 1 });

export const Syllabus =
  mongoose.models.Syllabus || mongoose.model('Syllabus', SyllabusSchema);
