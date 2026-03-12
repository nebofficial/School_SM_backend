import mongoose from 'mongoose';

const ExamMarkSchema = new mongoose.Schema(
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
    subjectCode: { type: String, trim: true, required: true },
    subjectName: { type: String, trim: true, default: '' },
    maxMarks: { type: Number, required: true, default: 0 },
    marksObtained: { type: Number, default: null },
    gradeCode: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

ExamMarkSchema.index(
  { examScheduleId: 1, registrationId: 1, subjectCode: 1 },
  { unique: true }
);

export const ExamMark =
  mongoose.models.ExamMark || mongoose.model('ExamMark', ExamMarkSchema);
