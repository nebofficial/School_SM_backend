import mongoose from 'mongoose';

const CompetencyMarkSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    examScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSchedule',
      required: true,
      index: true,
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      index: true,
    },
    marksObtained: { type: Number, default: null },
  },
  { timestamps: true }
);

CompetencyMarkSchema.index(
  { examScheduleId: 1, registrationId: 1 },
  { unique: true }
);

export const CompetencyMark =
  mongoose.models.CompetencyMark || mongoose.model('CompetencyMark', CompetencyMarkSchema);
