import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    userType: { type: String, required: true, trim: true, index: true },
    complainBy: { type: String, required: true, trim: true },
    complainTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComplaintType',
      required: true,
      index: true,
    },
    complainDate: { type: Date, required: true, default: () => new Date() },
    complain: { type: String, required: true, trim: true },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
