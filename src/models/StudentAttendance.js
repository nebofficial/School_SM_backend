import mongoose from 'mongoose';

const StudentAttendanceSchema = new mongoose.Schema(
  {
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicClass',
      required: true,
      index: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'leave'],
      default: 'present',
      index: true,
    },
    method: {
      type: String,
      enum: ['manual', 'biometric', 'qr', 'barcode', 'import'],
      default: 'manual',
      index: true,
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

StudentAttendanceSchema.index(
  { academicYearId: 1, registrationId: 1, date: 1 },
  { unique: true },
);
StudentAttendanceSchema.index({ academicYearId: 1, classId: 1, date: 1 });

export const StudentAttendance =
  mongoose.models.StudentAttendance ||
  mongoose.model('StudentAttendance', StudentAttendanceSchema);

