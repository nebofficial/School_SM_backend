import mongoose from 'mongoose';

const SubjectMarkConfigSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicClass',
      required: true,
      index: true,
    },
    isMain: { type: Boolean, default: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSubject' },
    name: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    // Optional date associated with this subject's mark configuration
    date: { type: Date, default: null },
    fullMark: { type: Number, default: 0 },
    passMark: { type: Number, default: 0 },
    subjectCrHr: { type: Number, default: 0 },
    practicalCrHr: { type: Number, default: 0 },
    theory: { type: Number, default: 0 },
    speaking: { type: Number, default: 0 },
    practical: { type: Number, default: 0 },
    oral: { type: Number, default: 0 },
    project: { type: Number, default: 0 },
    presentation: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SubjectMarkConfigSchema.index(
  { academicYearId: 1, examId: 1, classId: 1, subjectId: 1, name: 1, code: 1 },
  { unique: true }
);

export const SubjectMarkConfig =
  mongoose.models.SubjectMarkConfig ||
  mongoose.model('SubjectMarkConfig', SubjectMarkConfigSchema);

