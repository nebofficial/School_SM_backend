import express from 'express';
import { Driver } from '../models/Driver.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const driversRouter = express.Router();

// GET /api/drivers?academicYearId=
driversRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const items = await Driver.find({ academicYearId })
    .populate('assignedVehicleId', 'vehicleNumber vehicleModel')
    .sort({ name: 1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      assignedVehicleId: i.assignedVehicleId ? String(i.assignedVehicleId._id) : null,
      assignedVehicleNumber: i.assignedVehicleId?.vehicleNumber,
    })),
  });
});

// POST /api/drivers
driversRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  if (!name) return res.status(400).json({ message: 'name is required' });

  const doc = await Driver.create({
    academicYearId,
    name,
    license: (b.license || '').toString().trim(),
    phone: (b.phone || '').toString().trim(),
    assignedVehicleId: b.assignedVehicleId || null,
  });
  const populated = await Driver.findById(doc._id).populate('assignedVehicleId', 'vehicleNumber').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    assignedVehicleId: populated.assignedVehicleId ? String(populated.assignedVehicleId._id) : null,
    assignedVehicleNumber: populated.assignedVehicleId?.vehicleNumber,
  });
});

// PUT /api/drivers/:id
driversRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await Driver.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const b = req.body || {};
  if (b.name != null) doc.name = (b.name || '').toString().trim();
  if (b.license != null) doc.license = (b.license || '').toString().trim();
  if (b.phone != null) doc.phone = (b.phone || '').toString().trim();
  if (b.assignedVehicleId != null) doc.assignedVehicleId = b.assignedVehicleId || null;

  await doc.save();
  const populated = await Driver.findById(doc._id).populate('assignedVehicleId', 'vehicleNumber').lean();
  res.json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    assignedVehicleId: populated.assignedVehicleId ? String(populated.assignedVehicleId._id) : null,
    assignedVehicleNumber: populated.assignedVehicleId?.vehicleNumber,
  });
});

// DELETE /api/drivers/:id
driversRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await Driver.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  await Driver.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
