import express from 'express';
import { TransportAllocation } from '../models/TransportAllocation.js';
import { Route } from '../models/Route.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const transportAllocationsRouter = express.Router();

// GET /api/transport-allocations?academicYearId=&routeId=&studentId=
transportAllocationsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const query = { academicYearId };
  if (req.query.routeId) query.routeId = req.query.routeId;
  if (req.query.studentId) query.studentId = req.query.studentId;
  if (req.query.status) query.status = req.query.status;

  const items = await TransportAllocation.find(query)
    .populate('routeId', 'routeName routeStart routeEnd vehicleId')
    .populate({ path: 'routeId', populate: { path: 'vehicleId', select: 'vehicleNumber' } })
    .populate('studentId', 'firstName lastName admissionNumber className')
    .sort({ createdAt: -1 })
    .lean();

  const mapped = items.map((i) => {
    const route = i.routeId;
    const vehicle = route?.vehicleId;
    const student = i.studentId;
    return {
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      routeId: String(route?._id || i.routeId),
      studentId: String(student?._id || i.studentId),
      routeName: route?.routeName,
      vehicleNumber: vehicle?.vehicleNumber,
      studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '',
      admissionNumber: student?.admissionNumber,
      className: student?.className,
    };
  });

  res.json({ items: mapped });
});

// POST /api/transport-allocations
transportAllocationsRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const studentId = (b.studentId || '').toString().trim();
  const routeId = (b.routeId || '').toString().trim();
  const stopName = (b.stopName || '').toString().trim();
  if (!studentId || !routeId || !stopName) {
    return res.status(400).json({ message: 'studentId, routeId and stopName are required' });
  }

  const route = await Route.findOne({ _id: routeId, academicYearId }).lean();
  if (!route) return res.status(404).json({ message: 'Route not found' });

  const stop = route.stops?.find((s) => s.stopName === stopName);
  if (!stop) return res.status(400).json({ message: 'Stop not found in route' });

  const existing = await TransportAllocation.findOne({ academicYearId, studentId, status: 'active' });
  if (existing) {
    return res.status(400).json({ message: 'Student already has an active transport allocation' });
  }

  const doc = await TransportAllocation.create({
    academicYearId,
    studentId,
    routeId,
    stopName,
    stopKm: stop.stopKm || 0,
    stopFare: stop.stopFare || 0,
  });

  const populated = await TransportAllocation.findById(doc._id)
    .populate('routeId', 'routeName')
    .populate('studentId', 'firstName lastName admissionNumber')
    .lean();

  const r = populated.routeId;
  const s = populated.studentId;
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    routeId: String(r?._id),
    studentId: String(s?._id),
    routeName: r?.routeName,
    studentName: s ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : '',
  });
});

// PUT /api/transport-allocations/:id/deactivate
transportAllocationsRouter.put('/:id/deactivate', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await TransportAllocation.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  doc.status = 'inactive';
  await doc.save();

  res.json({
    ...doc.toObject(),
    _id: String(doc._id),
    academicYearId: String(doc.academicYearId),
    routeId: String(doc.routeId),
    studentId: String(doc.studentId),
  });
});
