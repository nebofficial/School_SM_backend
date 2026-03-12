import express from 'express';
import { Route } from '../models/Route.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const routesRouter = express.Router();

// GET /api/routes?academicYearId=&vehicleId=
routesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const query = { academicYearId };
  if (req.query.vehicleId) query.vehicleId = req.query.vehicleId;

  const items = await Route.find(query)
    .populate('vehicleId', 'vehicleNumber vehicleModel')
    .sort({ routeName: 1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      vehicleId: i.vehicleId ? String(i.vehicleId._id) : null,
      vehicleNumber: i.vehicleId?.vehicleNumber,
      vehicleModel: i.vehicleId?.vehicleModel,
    })),
  });
});

// POST /api/routes
routesRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const routeName = (b.routeName || '').toString().trim();
  const routeStart = (b.routeStart || '').toString().trim();
  const routeEnd = (b.routeEnd || '').toString().trim();
  if (!routeName || !routeStart || !routeEnd) {
    return res.status(400).json({ message: 'routeName, routeStart and routeEnd are required' });
  }

  const existing = await Route.findOne({ academicYearId, routeName });
  if (existing) return res.status(400).json({ message: 'Route name already exists' });

  const stops = Array.isArray(b.stops) ? b.stops.map((s) => ({
    stopName: (s.stopName || '').toString().trim(),
    stopKm: parseFloat(s.stopKm) || 0,
    stopFare: parseFloat(s.stopFare) || 0,
  })) : [];

  const doc = await Route.create({
    academicYearId,
    routeName,
    routeStart,
    routeEnd,
    vehicleId: b.vehicleId || null,
    stops,
  });
  const populated = await Route.findById(doc._id).populate('vehicleId', 'vehicleNumber vehicleModel').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    vehicleId: populated.vehicleId ? String(populated.vehicleId._id) : null,
    vehicleNumber: populated.vehicleId?.vehicleNumber,
    vehicleModel: populated.vehicleId?.vehicleModel,
  });
});

// PUT /api/routes/:id
routesRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await Route.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const b = req.body || {};
  if (b.routeName != null) doc.routeName = (b.routeName || '').toString().trim();
  if (b.routeStart != null) doc.routeStart = (b.routeStart || '').toString().trim();
  if (b.routeEnd != null) doc.routeEnd = (b.routeEnd || '').toString().trim();
  if (b.vehicleId != null) doc.vehicleId = b.vehicleId || null;
  if (Array.isArray(b.stops)) {
    doc.stops = b.stops.map((s) => ({
      stopName: (s.stopName || '').toString().trim(),
      stopKm: parseFloat(s.stopKm) || 0,
      stopFare: parseFloat(s.stopFare) || 0,
    }));
  }

  await doc.save();
  const populated = await Route.findById(doc._id).populate('vehicleId', 'vehicleNumber vehicleModel').lean();
  res.json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    vehicleId: populated.vehicleId ? String(populated.vehicleId._id) : null,
    vehicleNumber: populated.vehicleId?.vehicleNumber,
    vehicleModel: populated.vehicleId?.vehicleModel,
  });
});

// DELETE /api/routes/:id
routesRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await Route.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  await Route.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
