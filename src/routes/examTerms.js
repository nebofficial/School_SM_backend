import express from 'express';
import { ExamTerm } from '../models/ExamTerm.js';

export const examTermsRouter = express.Router();

examTermsRouter.get('/', async (_req, res) => {
  const items = await ExamTerm.find().sort({ name: 1 }).lean();
  res.json({ items });
});

examTermsRouter.get('/:id', async (req, res) => {
  const doc = await ExamTerm.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

examTermsRouter.post('/', async (req, res) => {
  const { name, division, displayName, description } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name is required' });
  const doc = await ExamTerm.create({
    name: String(name).trim(),
    division: String(division || '').trim(),
    displayName: String(displayName || '').trim(),
    description: String(description || '').trim(),
  });
  res.status(201).json(doc.toObject());
});

examTermsRouter.put('/:id', async (req, res) => {
  const { name, division, displayName, description } = req.body || {};
  const doc = await ExamTerm.findByIdAndUpdate(
    req.params.id,
    {
      ...(name != null ? { name: String(name).trim() } : {}),
      ...(division != null ? { division: String(division).trim() } : {}),
      ...(displayName != null ? { displayName: String(displayName).trim() } : {}),
      ...(description != null ? { description: String(description).trim() } : {}),
    },
    { new: true, runValidators: true }
  ).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

examTermsRouter.delete('/:id', async (req, res) => {
  const doc = await ExamTerm.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
