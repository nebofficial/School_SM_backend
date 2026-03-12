import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    supplier: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
