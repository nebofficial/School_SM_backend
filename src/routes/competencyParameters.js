import express from 'express';
import { CompetencyParameter } from '../models/CompetencyParameter.js';

export const competencyParametersRouter = express.Router();

competencyParametersRouter.get('/', async (_req, res) => {
  const items = await CompetencyParameter.find()
    .populate('examGradeId', 'name')
    .sort({ name: 1 })
    .lean();
  res.json({ items });
});

competencyParametersRouter.get('/:id', async (req, res) => {
  const doc = await CompetencyParameter.findById(req.params.id)
    .populate('examGradeId', 'name')
    .lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

competencyParametersRouter.post('/', async (req, res) => {
  const { name, examGradeId, description, domains } = req.body || {};
  if (!name || !examGradeId)
    return res.status(400).json({ message: 'name and examGradeId are required' });
  const mappedDomains = (Array.isArray(domains) ? domains : []).map((d, di) => ({
    domain: String(d.domain || '').trim(),
    code: String(d.code || '').trim(),
    order: di,
    indicators: (Array.isArray(d.indicators) ? d.indicators : []).map((ind, ii) => ({
      name: String(ind.name || '').trim(),
      code: String(ind.code || '').trim(),
      order: ii,
    })),
  }));
  const doc = await CompetencyParameter.create({
    name: String(name).trim(),
    examGradeId,
    description: String(description || '').trim(),
    domains: mappedDomains,
  });
  res.status(201).json(doc.toObject());
});

competencyParametersRouter.put('/:id', async (req, res) => {
  const { name, examGradeId, description, domains } = req.body || {};
  const update = {};
  if (name != null) update.name = String(name).trim();
  if (examGradeId != null) update.examGradeId = examGradeId;
  if (description != null) update.description = String(description).trim();
  if (Array.isArray(domains)) {
    update.domains = domains.map((d, di) => ({
      domain: String(d.domain || '').trim(),
      code: String(d.code || '').trim(),
      order: di,
      indicators: (Array.isArray(d.indicators) ? d.indicators : []).map((ind, ii) => ({
        name: String(ind.name || '').trim(),
        code: String(ind.code || '').trim(),
        order: ii,
      })),
    }));
  }
  const doc = await CompetencyParameter.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  ).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

competencyParametersRouter.delete('/:id', async (req, res) => {
  const doc = await CompetencyParameter.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
