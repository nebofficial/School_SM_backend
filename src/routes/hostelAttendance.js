import express from 'express';
import { HostelAttendance } from '../models/HostelAttendance.js';
import { RoomAllocation } from '../models/RoomAllocation.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const hostelAttendanceRouter = express.Router();

// GET /api/hostel-attendance?academicYearId=&date=&hostelId=
hostelAttendanceRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const dateStr = (req.query.date || '').toString().trim();
  const date = dateStr ? new Date(dateStr) : new Date();
  date.setHours(0, 0, 0, 0);

  const allocations = await RoomAllocation.find({ academicYearId, status: 'active' })
    .populate('roomId')
    .populate({ path: 'roomId', populate: { path: 'hostelId', select: 'name' } })
    .populate('studentId', 'firstName lastName admissionNumber')
    .sort({ 'roomId.hostelId.name': 1, 'roomId.roomNo': 1, seatNumber: 1 })
    .lean();

  const attendanceRecords = await HostelAttendance.find({
    academicYearId,
    date: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
  })
    .lean();

  const byAllocation = {};
  attendanceRecords.forEach((a) => {
    byAllocation[String(a.allocationId)] = a.status;
  });

  const items = allocations.map((a) => {
    const room = a.roomId;
    const hostel = room?.hostelId;
    const student = a.studentId;
    return {
      allocationId: String(a._id),
      roomId: String(room?._id),
      roomNo: room?.roomNo,
      hostelName: hostel?.name,
      seatNumber: a.seatNumber,
      studentId: String(student?._id || a.studentId),
      studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '',
      admissionNumber: student?.admissionNumber,
      status: byAllocation[String(a._id)] || 'present',
      date: date.toISOString().slice(0, 10),
    };
  });

  if (req.query.hostelId) {
    const filtered = items.filter((i) => {
      const alloc = allocations.find((x) => String(x._id) === i.allocationId);
      return alloc && String(alloc.roomId?.hostelId?._id || alloc.roomId?.hostelId) === req.query.hostelId;
    });
    return res.json({ items: filtered, date: date.toISOString().slice(0, 10) });
  }

  res.json({ items, date: date.toISOString().slice(0, 10) });
});

// POST /api/hostel-attendance (bulk upsert for a date)
hostelAttendanceRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const dateStr = (b.date || '').toString().trim();
  const records = Array.isArray(b.records) ? b.records : [];

  if (!dateStr || records.length === 0) {
    return res.status(400).json({ message: 'date and records array are required' });
  }

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  for (const r of records) {
    const allocationId = (r.allocationId || r.allocation_id || '').toString().trim();
    const status = (r.status || 'present').toString().toLowerCase();
    if (!allocationId || !['present', 'leave', 'absent', 'outpass'].includes(status)) continue;

    await HostelAttendance.findOneAndUpdate(
      { academicYearId, date, allocationId },
      { $set: { academicYearId, date, allocationId, status } },
      { upsert: true, new: true }
    );
  }

  res.json({ ok: true, date: date.toISOString().slice(0, 10) });
});

// PUT /api/hostel-attendance/:allocationId (set status for one for a date)
hostelAttendanceRouter.put('/:allocationId', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const allocationId = req.params.allocationId;
  const b = req.body || {};
  const dateStr = (b.date || req.query.date || '').toString().trim();
  const status = (b.status || 'present').toString().toLowerCase();

  if (!dateStr || !['present', 'leave', 'absent', 'outpass'].includes(status)) {
    return res.status(400).json({ message: 'date and valid status required' });
  }

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  const doc = await HostelAttendance.findOneAndUpdate(
    { academicYearId, date, allocationId },
    { $set: { academicYearId, date, allocationId, status } },
    { upsert: true, new: true }
  );

  res.json({ ...doc.toObject(), _id: String(doc._id) });
});
