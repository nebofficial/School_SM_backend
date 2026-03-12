import express from 'express';
import { ExamAssessment } from '../models/ExamAssessment.js';

export const examAssessmentsRouter = express.Router();

examAssessmentsRouter.get('/', async (_req, res) => {
  const items = await ExamAssessment.find().sort({ name: 1 }).lean();
  res.json({ items });
});

examAssessmentsRouter.get('/:id', async (req, res) => {
  const doc = await ExamAssessment.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

examAssessmentsRouter.post('/', async (req, res) => {
  const { name, description, records } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name is required' });
  const mappedRecords = (Array.isArray(records) ? records : []).map((r, i) => ({
    name: String(r.name || '').trim(),
    code: String(r.code || '').trim(),
    maxMark: Number(r.maxMark) || 0,
    passingMark: Number(r.passingMark) || 0,
    order: i,
  }));
  const doc = await ExamAssessment.create({
    name: String(name).trim(),
    description: String(description || '').trim(),
    records: mappedRecords,
  });
  res.status(201).json(doc.toObject());
});

examAssessmentsRouter.put('/:id', async (req, res) => {
  const { name, description, records } = req.body || {};
  const update = {};
  if (name != null) update.name = String(name).trim();
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
  const doc = await ExamAssessment.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

examAssessmentsRouter.delete('/:id', async (req, res) => {
  const doc = await ExamAssessment.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
