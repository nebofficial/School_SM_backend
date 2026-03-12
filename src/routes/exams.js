import express from 'express';
import { Exam } from '../models/Exam.js';

export const examsRouter = express.Router();

examsRouter.get('/', async (_req, res) => {
  const items = await Exam.find()
    .populate('examTermId', 'name')
    .sort({ name: 1 })
    .lean();
  res.json({ items });
});

examsRouter.get('/:id', async (req, res) => {
  const doc = await Exam.findById(req.params.id).populate('examTermId', 'name').lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

examsRouter.post('/', async (req, res) => {
  const { name, code, examTermId, assessmentFormat, displayName, weightage, description, division } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name is required' });
  const doc = await Exam.create({
    name: String(name).trim(),
    code: String(code || '').trim(),
    examTermId: examTermId || null,
    assessmentFormat: String(assessmentFormat || 'Mark Based').trim(),
    displayName: String(displayName || '').trim(),
    weightage: Number(weightage) || 100,
    description: String(description || '').trim(),
    division: String(division || '').trim(),
  });
  res.status(201).json(doc.toObject());
});

examsRouter.put('/:id', async (req, res) => {
  const { name, code, examTermId, assessmentFormat, displayName, weightage, description, division } = req.body || {};
  const doc = await Exam.findByIdAndUpdate(
    req.params.id,
    {
      ...(name != null ? { name: String(name).trim() } : {}),
      ...(code != null ? { code: String(code).trim() } : {}),
      ...(examTermId != null ? { examTermId: examTermId || null } : {}),
      ...(assessmentFormat != null ? { assessmentFormat: String(assessmentFormat).trim() } : {}),
      ...(displayName != null ? { displayName: String(displayName).trim() } : {}),
      ...(weightage != null ? { weightage: Number(weightage) || 100 } : {}),
      ...(description != null ? { description: String(description).trim() } : {}),
      ...(division != null ? { division: String(division).trim() } : {}),
    },
    { new: true, runValidators: true }
  )
    .populate('examTermId', 'name')
    .lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

examsRouter.delete('/:id', async (req, res) => {
  const doc = await Exam.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
