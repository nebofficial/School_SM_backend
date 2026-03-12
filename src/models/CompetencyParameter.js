import mongoose from 'mongoose';

const IndicatorSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const DomainSchema = new mongoose.Schema(
  {
    domain: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    indicators: { type: [IndicatorSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const CompetencyParameterSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    examGradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamGrade', required: true },
    description: { type: String, trim: true, default: '' },
    domains: { type: [DomainSchema], default: [] },
  },
  { timestamps: true }
);

CompetencyParameterSchema.index({ name: 1 });
CompetencyParameterSchema.index({ examGradeId: 1 });

export const CompetencyParameter =
  mongoose.models.CompetencyParameter ||
  mongoose.model('CompetencyParameter', CompetencyParameterSchema);
