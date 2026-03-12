import mongoose from 'mongoose';

const ExamTermSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    division: { type: String, trim: true, default: '' },
    displayName: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

ExamTermSchema.index({ name: 1 });

export const ExamTerm =
  mongoose.models.ExamTerm || mongoose.model('ExamTerm', ExamTermSchema);
