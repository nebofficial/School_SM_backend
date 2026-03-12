import express from 'express';
import { ExamGrade } from '../models/ExamGrade.js';

export const examGradesRouter = express.Router();

// GET /api/exam-grades
examGradesRouter.get('/', async (_req, res) => {
  const items = await ExamGrade.find().sort({ name: 1 }).lean();
  res.json({ items });
});

// GET /api/exam-grades/:id
examGradesRouter.get('/:id', async (req, res) => {
  const doc = await ExamGrade.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

// POST /api/exam-grades
examGradesRouter.post('/', async (req, res) => {
  const { name, description, grades } = req.body || {};
  if (!name || !Array.isArray(grades)) {
    return res.status(400).json({
      message: 'name and grades array are required',
    });
  }

  const mappedGrades = grades.map((g, i) => ({
    code: String(g.code || '').trim(),
    minScore: Number(g.minScore) || 0,
    maxScore: Number(g.maxScore) || 0,
    value: Number(g.value) ?? 0,
    label: String(g.label || '').trim(),
    color: String(g.color || '#6B7280').trim(),
    failGrade: Boolean(g.failGrade),
    order: i,
  }));

  const doc = await ExamGrade.create({
    name: String(name).trim(),
    description: String(description || '').trim(),
    grades: mappedGrades,
  });

  res.status(201).json(doc.toObject());
});

// PUT /api/exam-grades/:id
examGradesRouter.put('/:id', async (req, res) => {
  const { name, description, grades } = req.body || {};
  const id = req.params.id;

  const mappedGrades = Array.isArray(grades)
    ? grades.map((g, i) => ({
        code: String(g.code || '').trim(),
        minScore: Number(g.minScore) || 0,
        maxScore: Number(g.maxScore) || 0,
        value: Number(g.value) ?? 0,
        label: String(g.label || '').trim(),
        color: String(g.color || '#6B7280').trim(),
        failGrade: Boolean(g.failGrade),
        order: i,
      }))
    : undefined;

  const update = {};
  if (name != null) update.name = String(name).trim();
  if (description != null) update.description = String(description).trim();
  if (mappedGrades != null) update.grades = mappedGrades;

  const doc = await ExamGrade.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true }
  ).lean();

  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

// DELETE /api/exam-grades/:id
examGradesRouter.delete('/:id', async (req, res) => {
  const doc = await ExamGrade.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
