import express from 'express';
import { RoomAllocation } from '../models/RoomAllocation.js';
import { HostelRoom } from '../models/HostelRoom.js';
import { Hostel } from '../models/Hostel.js';
import { Registration } from '../models/Registration.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const roomAllocationsRouter = express.Router();

// GET /api/room-allocations/available-seats?academicYearId=&roomId= (must be before /:id)
roomAllocationsRouter.get('/available-seats', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const roomId = (req.query.roomId || '').toString().trim();
  if (!roomId) return res.status(400).json({ message: 'roomId is required' });

  const room = await HostelRoom.findOne({ _id: roomId, academicYearId }).lean();
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const occupied = await RoomAllocation.find({
    academicYearId,
    roomId,
    status: 'active',
  })
    .select('seatNumber')
    .lean();

  const occupiedSet = new Set(occupied.map((o) => o.seatNumber));
  const available = [];
  for (let s = 1; s <= room.seatTotal; s++) {
    if (!occupiedSet.has(s)) available.push(s);
  }

  res.json({ available, totalSeats: room.seatTotal });
});

// GET /api/room-allocations?academicYearId=&hostelId=&roomId=&studentId=
roomAllocationsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const query = { academicYearId, status: 'active' };
  if (req.query.roomId) query.roomId = req.query.roomId;
  if (req.query.studentId) query.studentId = req.query.studentId;

  let items = await RoomAllocation.find(query)
    .populate('roomId')
    .populate({
      path: 'roomId',
      populate: { path: 'hostelId', select: 'name hostelType' },
    })
    .populate('studentId', 'firstName lastName gender admissionNumber className')
    .sort({ allocatedAt: -1 })
    .lean();

  if (req.query.hostelId) {
    items = items.filter((i) => String(i.roomId?.hostelId?._id || i.roomId?.hostelId) === req.query.hostelId);
  }

  const mapped = items.map((i) => {
    const room = i.roomId;
    const hostel = room?.hostelId;
    const student = i.studentId;
    return {
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      roomId: String(room?._id || i.roomId),
      studentId: String(student?._id || i.studentId),
      roomNo: room?.roomNo,
      hostelName: hostel?.name,
      hostelType: hostel?.hostelType,
      studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '',
      studentGender: student?.gender,
      admissionNumber: student?.admissionNumber,
    };
  });

  res.json({ items: mapped });
});

// POST /api/room-allocations (allocate student to seat)
roomAllocationsRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const roomId = (b.roomId || '').toString().trim();
  const seatNumber = parseInt(b.seatNumber, 10);
  const studentId = (b.studentId || '').toString().trim();

  if (!roomId || !studentId || isNaN(seatNumber) || seatNumber < 1) {
    return res.status(400).json({ message: 'roomId, studentId and seatNumber are required' });
  }

  const room = await HostelRoom.findOne({ _id: roomId, academicYearId }).populate('hostelId').lean();
  if (!room) return res.status(404).json({ message: 'Room not found' });

  if (seatNumber > room.seatTotal) {
    return res.status(400).json({ message: 'Seat number exceeds room capacity' });
  }

  const existingSeat = await RoomAllocation.findOne({
    academicYearId,
    roomId,
    seatNumber,
    status: 'active',
  });
  if (existingSeat) {
    return res.status(400).json({ message: 'Seat is already occupied' });
  }

  const existingStudent = await RoomAllocation.findOne({
    academicYearId,
    studentId,
    status: 'active',
  });
  if (existingStudent) {
    return res.status(400).json({ message: 'Student is already allocated to another room' });
  }

  const student = await Registration.findById(studentId).lean();
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const hostel = room.hostelId;
  const hostelType = hostel?.hostelType || '';
  const studentGender = (student.gender || '').toString().toLowerCase();
  if (hostelType === 'boys' && studentGender !== 'male' && studentGender !== 'm') {
    return res.status(400).json({ message: 'Boys hostel accepts male students only' });
  }
  if (hostelType === 'girls' && studentGender !== 'female' && studentGender !== 'f') {
    return res.status(400).json({ message: 'Girls hostel accepts female students only' });
  }

  const doc = await RoomAllocation.create({
    academicYearId,
    roomId,
    seatNumber,
    studentId,
  });

  const populated = await RoomAllocation.findById(doc._id)
    .populate({ path: 'roomId', populate: { path: 'hostelId' } })
    .populate('studentId', 'firstName lastName gender admissionNumber')
    .lean();

  const r = populated.roomId;
  const h = r?.hostelId;
  const s = populated.studentId;
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    roomId: String(r?._id),
    studentId: String(s?._id),
    roomNo: r?.roomNo,
    hostelName: h?.name,
    hostelType: h?.hostelType,
    studentName: s ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : '',
    studentGender: s?.gender,
  });
});

// PUT /api/room-allocations/:id/vacate
roomAllocationsRouter.put('/:id/vacate', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await RoomAllocation.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  doc.status = 'vacated';
  await doc.save();

  res.json({
    ...doc.toObject(),
    _id: String(doc._id),
    academicYearId: String(doc.academicYearId),
    roomId: String(doc.roomId),
    studentId: String(doc.studentId),
  });
});
