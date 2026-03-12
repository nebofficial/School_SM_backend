import mongoose from 'mongoose';

const RoomAllocationSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostelRoom',
      required: true,
      index: true,
    },
    seatNumber: { type: Number, required: true, min: 1 },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      index: true,
    },
    allocatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'vacated'], default: 'active' },
  },
  { timestamps: true }
);

RoomAllocationSchema.index({ academicYearId: 1, roomId: 1, seatNumber: 1 }, { unique: true });
RoomAllocationSchema.index({ academicYearId: 1, studentId: 1 });

export const RoomAllocation = mongoose.models.RoomAllocation || mongoose.model('RoomAllocation', RoomAllocationSchema);
