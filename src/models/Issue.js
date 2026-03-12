import mongoose from 'mongoose';

const IssueSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    issuedTo: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: () => new Date() },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export const Issue = mongoose.models.Issue || mongoose.model('Issue', IssueSchema);
