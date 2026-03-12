import mongoose from 'mongoose';

const PayrollSchema = new mongoose.Schema(
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
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft',
      index: true
    },
    paymentDate: { type: Date },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

PayrollSchema.index({ academicYearId: 1, staffId: 1, month: 1, year: 1 }, { unique: true });

export const Payroll =
  mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);
