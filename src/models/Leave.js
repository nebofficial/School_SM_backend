import mongoose from 'mongoose';

const LeaveSchema = new mongoose.Schema(
  {
    applicantType: {
      type: String,
      enum: ['staff', 'student'],
      default: 'staff',
      index: true
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    },
    leaveType: {
      type: String,
      enum: ['sick', 'casual', 'annual', 'emergency', 'other'],
      default: 'casual',
      index: true
    },
    applicationDate: { type: Date, default: () => new Date(), index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String, trim: true },
    attachmentUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true }
  },
  { timestamps: true }
);

LeaveSchema.index({ academicYearId: 1, staffId: 1, startDate: 1 });

export const Leave =
  mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
