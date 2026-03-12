import mongoose from 'mongoose';

const AssetIssueSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true,
    },
    issuedTo: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: { type: String, required: true, enum: ['issued', 'returned'], default: 'issued', index: true },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export const AssetIssue = mongoose.models.AssetIssue || mongoose.model('AssetIssue', AssetIssueSchema);
