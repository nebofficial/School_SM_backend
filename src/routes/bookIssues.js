import express from 'express';
import { BookIssue } from '../models/BookIssue.js';
import { Book } from '../models/Book.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const bookIssuesRouter = express.Router();

// GET /api/book-issues?academicYearId=&status=&memberId=
bookIssuesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const query = { academicYearId };
  if (req.query.status) query.status = req.query.status;
  if (req.query.memberId) query.memberId = req.query.memberId;

  const items = await BookIssue.find(query)
    .populate('bookId', 'title bookId author')
    .populate({
      path: 'memberId',
      populate: [
        { path: 'studentId', select: 'firstName lastName admissionNumber' },
        { path: 'staffId', select: 'fullName' },
      ],
    })
    .sort({ issuedAt: -1 })
    .lean();

  const mapped = items.map((i) => {
    const m = i.memberId;
    let displayName = 'Unknown';
    if (m) {
      if (m.memberType === 'student' && m.studentId) {
        displayName = `${m.studentId.firstName || ''} ${m.studentId.lastName || ''}`.trim() || 'Student';
      } else if (m.memberType === 'staff' && m.staffId) {
        displayName = m.staffId.fullName || 'Staff';
      }
    }
    return {
      ...i,
      _id: String(i._id),
      bookTitle: i.bookId?.title,
      bookId: i.bookId?.bookId,
      memberName: displayName,
    };
  });

  res.json({ items: mapped });
});

// POST /api/book-issues (New Issue)
bookIssuesRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const { bookId, memberId, returnDate } = req.body || {};
  if (!bookId || !memberId || !returnDate) {
    return res.status(400).json({ message: 'bookId, memberId and returnDate are required' });
  }

  const book = await Book.findOne({ _id: bookId, academicYearId });
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (book.quantity < 1) {
    return res.status(400).json({ message: 'Book not available' });
  }

  const doc = await BookIssue.create({
    academicYearId,
    bookId,
    memberId,
    returnDate: new Date(returnDate),
    status: 'issued',
  });

  await Book.findByIdAndUpdate(bookId, { $inc: { quantity: -1 } });

  res.status(201).json(doc.toObject());
});

// PUT /api/book-issues/:id/return (Return Book)
bookIssuesRouter.put('/:id/return', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await BookIssue.findOne({ _id: req.params.id, academicYearId, status: 'issued' });
  if (!doc) return res.status(404).json({ message: 'Not found or already returned' });

  const now = new Date();
  let fine = 0;
  if (now > doc.returnDate) {
    const daysLate = Math.ceil((now - doc.returnDate) / (1000 * 60 * 60 * 24));
    fine = daysLate * 5; // ₹5 per day
  }

  doc.returnedAt = now;
  doc.status = 'returned';
  doc.fineAmount = fine;
  await doc.save();

  await Book.findByIdAndUpdate(doc.bookId, { $inc: { quantity: 1 } });

  res.json(doc.toObject());
});
