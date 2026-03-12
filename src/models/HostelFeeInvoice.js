import mongoose from 'mongoose';

const HostelFeeInvoiceSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomAllocation',
      required: true,
      index: true,
    },
    month: { type: String, required: true, trim: true }, // YYYY-MM
    roomCharge: { type: Number, default: 0 },
    messCharge: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

HostelFeeInvoiceSchema.index({ academicYearId: 1, allocationId: 1, month: 1 }, { unique: true });

export const HostelFeeInvoice = mongoose.models.HostelFeeInvoice || mongoose.model('HostelFeeInvoice', HostelFeeInvoiceSchema);
