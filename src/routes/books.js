import express from 'express';
import { Book } from '../models/Book.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const booksRouter = express.Router();

// GET /api/books?academicYearId=&q=
booksRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const q = (req.query.q || '').toString().trim();
  const query = { academicYearId };
  if (q) {
    query.$or = [
      { title: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { bookId: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { author: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    ];
  }

  const items = await Book.find(query).sort({ title: 1 }).lean();
  res.json({ items: items.map((i) => ({ ...i, _id: String(i._id), academicYearId: String(i.academicYearId) })) });
});

// POST /api/books
booksRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const title = (b.title || '').toString().trim();
  const bookId = (b.bookId || '').toString().trim();
  if (!title || !bookId) {
    return res.status(400).json({ message: 'title and bookId are required' });
  }
  const qty = parseInt(b.quantity, 10);
  if (isNaN(qty) || qty < 0) {
    return res.status(400).json({ message: 'quantity must be a non-negative number' });
  }

  const existing = await Book.findOne({ academicYearId, bookId });
  if (existing) {
    return res.status(400).json({ message: 'Book ID already exists' });
  }

  const doc = await Book.create({
    academicYearId,
    title,
    bookId,
    isbnNo: (b.isbnNo || '').toString().trim(),
    edition: (b.edition || '').toString().trim(),
    author: (b.author || '').toString().trim(),
    language: (b.language || '').toString().trim(),
    price: parseFloat(b.price) || 0,
    quantity: qty,
    almiraNo: (b.almiraNo || '').toString().trim(),
    bookCoverUrl: (b.bookCoverUrl || '').toString().trim(),
  });
  res.status(201).json(doc.toObject());
});

// PUT /api/books/:id
booksRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await Book.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const b = req.body || {};
  if (b.title != null) doc.title = (b.title || '').toString().trim();
  if (b.bookId != null) doc.bookId = (b.bookId || '').toString().trim();
  if (b.isbnNo != null) doc.isbnNo = (b.isbnNo || '').toString().trim();
  if (b.edition != null) doc.edition = (b.edition || '').toString().trim();
  if (b.author != null) doc.author = (b.author || '').toString().trim();
  if (b.language != null) doc.language = (b.language || '').toString().trim();
  if (b.price != null) doc.price = parseFloat(b.price) || 0;
  if (b.quantity != null) doc.quantity = Math.max(0, parseInt(b.quantity, 10) || 0);
  if (b.almiraNo != null) doc.almiraNo = (b.almiraNo || '').toString().trim();
  if (b.bookCoverUrl != null) doc.bookCoverUrl = (b.bookCoverUrl || '').toString().trim();

  await doc.save();
  res.json(doc.toObject());
});

// DELETE /api/books/:id
booksRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await Book.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  await Book.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
