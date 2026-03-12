import mongoose from 'mongoose';

const ExamResultSchema = new mongoose.Schema(
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
    totalMarks: { type: Number, default: 0 },
    maxTotalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    gradeCode: { type: String, trim: true, default: '' },
    isPass: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ExamResultSchema.index(
  { examScheduleId: 1, registrationId: 1 },
  { unique: true }
);

export const ExamResult =
  mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema);
