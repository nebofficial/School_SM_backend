import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    code: { type: String, trim: true, default: '' },
    examTermId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamTerm', default: null },
    assessmentFormat: { type: String, trim: true, default: 'Mark Based' },
    displayName: { type: String, trim: true, default: '' },
    weightage: { type: Number, default: 100 },
    description: { type: String, trim: true, default: '' },
    division: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

ExamSchema.index({ name: 1 });
ExamSchema.index({ examTermId: 1 });

export const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
