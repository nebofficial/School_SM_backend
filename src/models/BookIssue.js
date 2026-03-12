import mongoose from 'mongoose';

const BookIssueSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'LibraryMember', required: true },
    issuedAt: { type: Date, default: () => new Date() },
    returnDate: { type: Date, required: true },
    returnedAt: { type: Date },
    fineAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['issued', 'returned'], default: 'issued' },
  },
  { timestamps: true }
);

BookIssueSchema.index({ academicYearId: 1, status: 1 });
BookIssueSchema.index({ bookId: 1, status: 1 });
BookIssueSchema.index({ memberId: 1, status: 1 });

export const BookIssue =
  mongoose.models.BookIssue || mongoose.model('BookIssue', BookIssueSchema);
