import express from 'express';
import { HostelFeeInvoice } from '../models/HostelFeeInvoice.js';
import { RoomAllocation } from '../models/RoomAllocation.js';
import { HostelRoom } from '../models/HostelRoom.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const hostelFeesRouter = express.Router();

const DEFAULT_MESS_CHARGE = 2500;

// GET /api/hostel-fees?academicYearId=&month=
hostelFeesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  let month = (req.query.month || '').toString().trim();
  if (!month) {
    const d = new Date();
    month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  const allocations = await RoomAllocation.find({ academicYearId, status: 'active' })
    .populate('roomId')
    .populate({ path: 'roomId', populate: { path: 'hostelId', select: 'name' } })
    .populate('studentId', 'firstName lastName admissionNumber')
    .lean();

  const existingInvoices = await HostelFeeInvoice.find({ academicYearId, month }).lean();
  const byAllocation = {};
  existingInvoices.forEach((inv) => {
    byAllocation[String(inv.allocationId)] = inv;
  });

  const items = [];
  for (const a of allocations) {
    const room = a.roomId;
    const hostel = room?.hostelId;
    const student = a.studentId;
    let inv = byAllocation[String(a._id)];
    if (!inv) {
      const roomCharge = room?.costPerSeat ?? 0;
      const messCharge = DEFAULT_MESS_CHARGE;
      inv = await HostelFeeInvoice.create({
        academicYearId,
        allocationId: a._id,
        month,
        roomCharge,
        messCharge,
        paidAmount: 0,
      });
      inv = inv.toObject();
    }
    items.push({
      ...inv,
      _id: String(inv._id),
      academicYearId: String(inv.academicYearId),
      allocationId: String(a._id),
      roomNo: room?.roomNo,
      hostelName: hostel?.name,
      studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '',
      admissionNumber: student?.admissionNumber,
      totalAmount: (inv.roomCharge || 0) + (inv.messCharge || 0),
    });
  }

  res.json({ items, month });
});

// PUT /api/hostel-fees/:id/pay
hostelFeesRouter.put('/:id/pay', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const paidAmount = parseFloat(b.paidAmount) ?? 0;

  const doc = await HostelFeeInvoice.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  doc.paidAmount = Math.max(0, paidAmount);
  await doc.save();

  res.json({ ...doc.toObject(), _id: String(doc._id) });
});
