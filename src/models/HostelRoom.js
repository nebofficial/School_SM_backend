import mongoose from 'mongoose';

const HostelRoomSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
      index: true,
    },
    roomNo: { type: String, required: true, trim: true },
    roomType: { type: String, required: true, enum: ['single', 'double', 'triple', 'dormitory'], trim: true },
    seatTotal: { type: Number, required: true, min: 1 },
    costPerSeat: { type: Number, default: 0 },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

HostelRoomSchema.index({ academicYearId: 1, hostelId: 1, roomNo: 1 }, { unique: true });

export const HostelRoom = mongoose.models.HostelRoom || mongoose.model('HostelRoom', HostelRoomSchema);
