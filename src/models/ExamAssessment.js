import mongoose from 'mongoose';

const ExamAssessmentRecordSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    maxMark: { type: Number, default: 0 },
    passingMark: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const ExamAssessmentSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    records: { type: [ExamAssessmentRecordSchema], default: [] },
  },
  { timestamps: true }
);

ExamAssessmentSchema.index({ name: 1 });

export const ExamAssessment =
  mongoose.models.ExamAssessment || mongoose.model('ExamAssessment', ExamAssessmentSchema);
