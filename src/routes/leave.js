import express from 'express';
import { Leave } from '../models/Leave.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const leaveRouter = express.Router();

// GET /api/leave?academicYearId=&staffId=&status=&from=&to=
leaveRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const staffId = (req.query.staffId || '').toString();
  const status = (req.query.status || '').toString();
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;

  const query = { academicYearId };
  if (staffId) query.staffId = staffId;
  if (status) query.status = status;
  if (from || to) {
    query.startDate = {};
    if (from) query.startDate.$gte = from;
    if (to) query.startDate.$lte = to;
  }

  const items = await Leave.find(query)
    .populate('staffId', 'fullName')
    .populate('studentId', 'fullName')
    .populate('approvedBy', 'fullName')
    .sort({ startDate: -1 })
    .lean();
  res.json({ items });
});

// POST /api/leave
leaveRouter.post('/', async (req, res) => {
  const {
    applicantType,
    staffId,
    studentId,
    academicYearId,
    leaveType,
    applicationDate,
    startDate,
    endDate,
    days,
    reason,
    attachmentUrl,
  } = req.body || {};
  if (!startDate || !endDate || days == null) {
    return res.status(400).json({
      message: 'startDate, endDate and days are required',
    });
  }

  const ensuredYearId = await ensureCurrentAcademicYear(
    { ...req, body: { ...req.body, academicYearId } },
    res,
  );
  if (!ensuredYearId) return;

  const type = applicantType || 'staff';
  if (type === 'staff' && !staffId) {
    return res.status(400).json({ message: 'staffId is required when applicantType is staff' });
  }
  if (type === 'student' && !studentId) {
    return res.status(400).json({ message: 'studentId is required when applicantType is student' });
  }

  const doc = await Leave.create({
    applicantType: type,
    staffId: type === 'staff' ? staffId : undefined,
    studentId: type === 'student' ? studentId : undefined,
    academicYearId: ensuredYearId,
    leaveType: leaveType || 'casual',
    applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    days,
    reason,
    attachmentUrl: attachmentUrl || undefined,
    status: 'pending',
  });
  res.status(201).json(doc.toObject());
});

// PUT /api/leave/:id
leaveRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, approvedBy, rejectionReason } = req.body || {};

  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const existing = await Leave.findById(id).lean();
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.academicYearId.toString() !== academicYearId) {
    return res.status(400).json({
      message: 'Leave does not belong to the current academic year',
    });
  }

  const update = {};
  if (status === 'approved') {
    update.status = 'approved';
    update.approvedBy = approvedBy;
    update.approvedAt = new Date();
  } else if (status === 'rejected') {
    update.status = 'rejected';
    update.rejectionReason = rejectionReason;
  } else if (status) {
    update.status = status;
  }

  const updated = await Leave.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated.toObject());
});

// DELETE /api/leave/:id
leaveRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const existing = await Leave.findById(id).lean();
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.academicYearId.toString() !== academicYearId) {
    return res.status(400).json({
      message: 'Leave does not belong to the current academic year',
    });
  }

  await Leave.findByIdAndDelete(id);
  res.status(204).send();
});
