import express from 'express';
import { Complaint } from '../models/Complaint.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const complaintsRouter = express.Router();

complaintsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const items = await Complaint.find({ academicYearId })
    .populate('complainTypeId', 'name')
    .sort({ complainDate: -1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      complainTypeId: i.complainTypeId ? String(i.complainTypeId._id) : null,
      complainTypeName: i.complainTypeId?.name,
    })),
  });
});

complaintsRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const userType = (b.userType || '').toString().trim();
  const complainBy = (b.complainBy || '').toString().trim();
  const complainTypeId = b.complainTypeId || null;
  const complainDate = b.complainDate ? new Date(b.complainDate) : new Date();
  const complain = (b.complain || '').toString().trim();
  if (!userType) return res.status(400).json({ message: 'userType is required' });
  if (!complainBy) return res.status(400).json({ message: 'complainBy is required' });
  if (!complainTypeId) return res.status(400).json({ message: 'complainTypeId is required' });
  if (!complain) return res.status(400).json({ message: 'complain is required' });

  const doc = await Complaint.create({
    academicYearId,
    userType,
    complainBy,
    complainTypeId,
    complainDate,
    complain,
    note: (b.note || '').toString().trim(),
  });
  const populated = await Complaint.findById(doc._id).populate('complainTypeId', 'name').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    complainTypeId: String(populated.complainTypeId._id),
    complainTypeName: populated.complainTypeId?.name,
  });
});

complaintsRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await Complaint.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await Complaint.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
