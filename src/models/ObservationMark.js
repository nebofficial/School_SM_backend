import mongoose from 'mongoose';

const ObservationMarkSchema = new mongoose.Schema(
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

ObservationMarkSchema.index(
  { examScheduleId: 1, registrationId: 1 },
  { unique: true }
);

export const ObservationMark =
  mongoose.models.ObservationMark || mongoose.model('ObservationMark', ObservationMarkSchema);
