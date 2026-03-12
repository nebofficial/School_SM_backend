import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    bookId: { type: String, required: true, trim: true },
    isbnNo: { type: String, trim: true, default: '' },
    edition: { type: String, trim: true, default: '' },
    author: { type: String, trim: true, default: '' },
    language: { type: String, trim: true, default: '' },
    price: { type: Number, default: 0 },
    quantity: { type: Number, required: true, default: 0 },
    almiraNo: { type: String, trim: true, default: '' },
    bookCoverUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

BookSchema.index({ academicYearId: 1, bookId: 1 }, { unique: true });

export const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);
