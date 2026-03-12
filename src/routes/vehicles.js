import express from 'express';
import { Vehicle } from '../models/Vehicle.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const vehiclesRouter = express.Router();

// GET /api/vehicles?academicYearId=
vehiclesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const items = await Vehicle.find({ academicYearId })
    .populate('driverId', 'name phone')
    .sort({ vehicleNumber: 1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      driverId: i.driverId ? String(i.driverId._id) : null,
      driverName: i.driverId?.name,
      driverPhone: i.driverId?.phone,
    })),
  });
});

// POST /api/vehicles
vehiclesRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const vehicleNumber = (b.vehicleNumber || '').toString().trim();
  const vehicleModel = (b.vehicleModel || '').toString().toLowerCase();
  if (!vehicleNumber || !vehicleModel) {
    return res.status(400).json({ message: 'vehicleNumber and vehicleModel are required' });
  }
  if (!['bus', 'van', 'mini-bus'].includes(vehicleModel)) {
    return res.status(400).json({ message: 'vehicleModel must be bus, van, or mini-bus' });
  }

  const existing = await Vehicle.findOne({ academicYearId, vehicleNumber });
  if (existing) return res.status(400).json({ message: 'Vehicle number already exists' });

  const doc = await Vehicle.create({
    academicYearId,
    vehicleNumber,
    vehicleModel,
    driverId: b.driverId || null,
    vehicleLicense: (b.vehicleLicense || '').toString().trim(),
    vehicleContact: (b.vehicleContact || '').toString().trim(),
    note: (b.note || '').toString().trim(),
  });
  const populated = await Vehicle.findById(doc._id).populate('driverId', 'name phone').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    driverId: populated.driverId ? String(populated.driverId._id) : null,
    driverName: populated.driverId?.name,
    driverPhone: populated.driverId?.phone,
  });
});

// PUT /api/vehicles/:id
vehiclesRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await Vehicle.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const b = req.body || {};
  if (b.vehicleNumber != null) doc.vehicleNumber = (b.vehicleNumber || '').toString().trim();
  if (b.vehicleModel != null) {
    const vm = (b.vehicleModel || '').toString().toLowerCase();
    if (['bus', 'van', 'mini-bus'].includes(vm)) doc.vehicleModel = vm;
  }
  if (b.driverId != null) doc.driverId = b.driverId || null;
  if (b.vehicleLicense != null) doc.vehicleLicense = (b.vehicleLicense || '').toString().trim();
  if (b.vehicleContact != null) doc.vehicleContact = (b.vehicleContact || '').toString().trim();
  if (b.note != null) doc.note = (b.note || '').toString().trim();

  await doc.save();
  const populated = await Vehicle.findById(doc._id).populate('driverId', 'name phone').lean();
  res.json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    driverId: populated.driverId ? String(populated.driverId._id) : null,
    driverName: populated.driverId?.name,
    driverPhone: populated.driverId?.phone,
  });
});

// DELETE /api/vehicles/:id
vehiclesRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await Vehicle.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  await Vehicle.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
