import mongoose from 'mongoose';

const GradeRecordSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true, required: true },
    minScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    value: { type: Number, required: true },
    label: { type: String, trim: true, default: '' },
    color: { type: String, trim: true, default: '#6B7280' },
    failGrade: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const ExamGradeSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    grades: { type: [GradeRecordSchema], default: [] },
  },
  { timestamps: true }
);

ExamGradeSchema.index({ name: 1 });

export const ExamGrade =
  mongoose.models.ExamGrade || mongoose.model('ExamGrade', ExamGradeSchema);
