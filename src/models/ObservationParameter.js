import mongoose from 'mongoose';

const ObservationRecordSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    maxMark: { type: Number, default: 0 },
    passingMark: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const ObservationParameterSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    examGradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamGrade', required: true },
    description: { type: String, trim: true, default: '' },
    records: { type: [ObservationRecordSchema], default: [] },
  },
  { timestamps: true }
);

ObservationParameterSchema.index({ name: 1 });
ObservationParameterSchema.index({ examGradeId: 1 });

export const ObservationParameter =
  mongoose.models.ObservationParameter ||
  mongoose.model('ObservationParameter', ObservationParameterSchema);
