import mongoose from 'mongoose';

const TransportFeeInvoiceSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportAllocation',
      required: true,
      index: true,
    },
    month: { type: String, required: true, trim: true }, // YYYY-MM
    fare: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

TransportFeeInvoiceSchema.index({ academicYearId: 1, allocationId: 1, month: 1 }, { unique: true });

export const TransportFeeInvoice = mongoose.models.TransportFeeInvoice || mongoose.model('TransportFeeInvoice', TransportFeeInvoiceSchema);
