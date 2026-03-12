import express from 'express';
import { TransportFeeInvoice } from '../models/TransportFeeInvoice.js';
import { TransportAllocation } from '../models/TransportAllocation.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const transportFeesRouter = express.Router();

// GET /api/transport-fees?academicYearId=&month=
transportFeesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  let month = (req.query.month || '').toString().trim();
  if (!month) {
    const d = new Date();
    month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  const allocations = await TransportAllocation.find({ academicYearId, status: 'active' })
    .populate('routeId', 'routeName')
    .populate('studentId', 'firstName lastName admissionNumber')
    .lean();

  const existingInvoices = await TransportFeeInvoice.find({ academicYearId, month }).lean();
  const byAllocation = {};
  existingInvoices.forEach((inv) => {
    byAllocation[String(inv.allocationId)] = inv;
  });

  const items = [];
  for (const a of allocations) {
    const route = a.routeId;
    const student = a.studentId;
    let inv = byAllocation[String(a._id)];
    if (!inv) {
      inv = await TransportFeeInvoice.create({
        academicYearId,
        allocationId: a._id,
        month,
        fare: a.stopFare || 0,
        paidAmount: 0,
      });
      inv = inv.toObject();
    }
    items.push({
      ...inv,
      _id: String(inv._id),
      academicYearId: String(inv.academicYearId),
      allocationId: String(a._id),
      routeName: route?.routeName,
      stopName: a.stopName,
      studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '',
      admissionNumber: student?.admissionNumber,
      fare: inv.fare || a.stopFare || 0,
    });
  }

  res.json({ items, month });
});

// PUT /api/transport-fees/:id/pay
transportFeesRouter.put('/:id/pay', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const paidAmount = parseFloat(b.paidAmount) ?? 0;

  const doc = await TransportFeeInvoice.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  doc.paidAmount = Math.max(0, paidAmount);
  await doc.save();

  res.json({ ...doc.toObject(), _id: String(doc._id) });
});
