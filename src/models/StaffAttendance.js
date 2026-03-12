import mongoose from 'mongoose';

const StaffAttendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'leave'],
      default: 'present',
      index: true
    },
    method: {
      type: String,
      enum: ['manual', 'biometric', 'qr', 'barcode', 'import'],
      default: 'manual',
      index: true
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

StaffAttendanceSchema.index({ academicYearId: 1, staffId: 1, date: 1 }, { unique: true });

export const StaffAttendance =
  mongoose.models.StaffAttendance ||
  mongoose.model('StaffAttendance', StaffAttendanceSchema);
