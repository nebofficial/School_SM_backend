import express from 'express';
import { ObservationParameter } from '../models/ObservationParameter.js';

export const observationParametersRouter = express.Router();

observationParametersRouter.get('/', async (_req, res) => {
  const items = await ObservationParameter.find()
    .populate('examGradeId', 'name')
    .sort({ name: 1 })
    .lean();
  res.json({ items });
});

observationParametersRouter.get('/:id', async (req, res) => {
  const doc = await ObservationParameter.findById(req.params.id)
    .populate('examGradeId', 'name')
    .lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

observationParametersRouter.post('/', async (req, res) => {
  const { name, examGradeId, description, records } = req.body || {};
  if (!name || !examGradeId)
    return res.status(400).json({ message: 'name and examGradeId are required' });
  const mappedRecords = (Array.isArray(records) ? records : []).map((r, i) => ({
    name: String(r.name || '').trim(),
    code: String(r.code || '').trim(),
    maxMark: Number(r.maxMark) || 0,
    passingMark: Number(r.passingMark) || 0,
    order: i,
  }));
  const doc = await ObservationParameter.create({
    name: String(name).trim(),
    examGradeId,
    description: String(description || '').trim(),
    records: mappedRecords,
  });
  res.status(201).json(doc.toObject());
});

observationParametersRouter.put('/:id', async (req, res) => {
  const { name, examGradeId, description, records } = req.body || {};
  const update = {};
  if (name != null) update.name = String(name).trim();
  if (examGradeId != null) update.examGradeId = examGradeId;
  if (description != null) update.description = String(description).trim();
  if (Array.isArray(records)) {
    update.records = records.map((r, i) => ({
      name: String(r.name || '').trim(),
      code: String(r.code || '').trim(),
      maxMark: Number(r.maxMark) || 0,
      passingMark: Number(r.passingMark) || 0,
      order: i,
    }));
  }
  const doc = await ObservationParameter.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  ).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

observationParametersRouter.delete('/:id', async (req, res) => {
  const doc = await ObservationParameter.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
