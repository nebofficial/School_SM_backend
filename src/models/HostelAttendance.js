import mongoose from 'mongoose';

const HostelAttendanceSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomAllocation',
      required: true,
      index: true,
    },
    status: { type: String, required: true, enum: ['present', 'leave', 'absent', 'outpass'], default: 'present' },
  },
  { timestamps: true }
);

HostelAttendanceSchema.index({ academicYearId: 1, date: 1, allocationId: 1 }, { unique: true });

export const HostelAttendance = mongoose.models.HostelAttendance || mongoose.model('HostelAttendance', HostelAttendanceSchema);
