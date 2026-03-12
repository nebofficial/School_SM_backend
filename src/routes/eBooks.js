import express from 'express';
import { EBook } from '../models/EBook.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const eBooksRouter = express.Router();

// GET /api/e-books?academicYearId=&classId=&subjectId=&q=
eBooksRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const query = { academicYearId };
  if (req.query.classId) query.classId = req.query.classId;
  if (req.query.subjectId) query.subjectId = req.query.subjectId;
  const q = (req.query.q || '').toString().trim();
  if (q) {
    query.$or = [
      { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { author: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    ];
  }

  const items = await EBook.find(query)
    .populate('classId', 'name')
    .populate('subjectId', 'name')
    .sort({ name: 1 })
    .lean();

  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      className: i.classId?.name,
      subjectName: i.subjectId?.name,
    })),
  });
});

// POST /api/e-books
eBooksRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  if (!name) return res.status(400).json({ message: 'name is required' });

  const doc = await EBook.create({
    academicYearId,
    classId: b.classId || null,
    subjectId: b.subjectId || null,
    name,
    edition: (b.edition || '').toString().trim(),
    author: (b.author || '').toString().trim(),
    language: (b.language || '').toString().trim(),
    coverImageUrl: (b.coverImageUrl || '').toString().trim(),
    documentUrl: (b.documentUrl || '').toString().trim(),
  });
  res.status(201).json(doc.toObject());
});

// PUT /api/e-books/:id
eBooksRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await EBook.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const b = req.body || {};
  if (b.name != null) doc.name = (b.name || '').toString().trim();
  if (b.classId != null) doc.classId = b.classId || null;
  if (b.subjectId != null) doc.subjectId = b.subjectId || null;
  if (b.edition != null) doc.edition = (b.edition || '').toString().trim();
  if (b.author != null) doc.author = (b.author || '').toString().trim();
  if (b.language != null) doc.language = (b.language || '').toString().trim();
  if (b.coverImageUrl != null) doc.coverImageUrl = (b.coverImageUrl || '').toString().trim();
  if (b.documentUrl != null) doc.documentUrl = (b.documentUrl || '').toString().trim();

  await doc.save();
  res.json(doc.toObject());
});

// DELETE /api/e-books/:id
eBooksRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await EBook.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  await EBook.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
