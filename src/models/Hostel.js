import mongoose from 'mongoose';

const HostelSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    hostelType: { type: String, required: true, enum: ['boys', 'girls', 'staff'], trim: true },
    address: { type: String, required: true, trim: true },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export const Hostel = mongoose.models.Hostel || mongoose.model('Hostel', HostelSchema);
