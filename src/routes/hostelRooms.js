import express from 'express';
import { HostelRoom } from '../models/HostelRoom.js';
import { Hostel } from '../models/Hostel.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const hostelRoomsRouter = express.Router();

// GET /api/hostel-rooms?academicYearId=&hostelId=
hostelRoomsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const query = { academicYearId };
  if (req.query.hostelId) query.hostelId = req.query.hostelId;

  const items = await HostelRoom.find(query)
    .populate('hostelId', 'name hostelType')
    .sort({ roomNo: 1 })
    .lean();

  const mapped = items.map((i) => ({
    ...i,
    _id: String(i._id),
    academicYearId: String(i.academicYearId),
    hostelId: String(i.hostelId?._id || i.hostelId),
    hostelName: i.hostelId?.name,
    hostelType: i.hostelId?.hostelType,
  }));
  res.json({ items: mapped });
});

// POST /api/hostel-rooms
hostelRoomsRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const hostelId = (b.hostelId || '').toString().trim();
  const roomNo = (b.roomNo || '').toString().trim();
  const roomType = (b.roomType || '').toString().toLowerCase();
  const seatTotal = parseInt(b.seatTotal, 10);

  if (!hostelId || !roomNo || !roomType) {
    return res.status(400).json({ message: 'hostelId, roomNo and roomType are required' });
  }
  if (!['single', 'double', 'triple', 'dormitory'].includes(roomType)) {
    return res.status(400).json({ message: 'roomType must be single, double, triple, or dormitory' });
  }
  if (isNaN(seatTotal) || seatTotal < 1) {
    return res.status(400).json({ message: 'seatTotal must be at least 1' });
  }

  const hostel = await Hostel.findOne({ _id: hostelId, academicYearId });
  if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

  const existing = await HostelRoom.findOne({ academicYearId, hostelId, roomNo });
  if (existing) return res.status(400).json({ message: 'Room number already exists in this hostel' });

  const doc = await HostelRoom.create({
    academicYearId,
    hostelId,
    roomNo,
    roomType,
    seatTotal,
    costPerSeat: parseFloat(b.costPerSeat) || 0,
    note: (b.note || '').toString().trim(),
  });

  const populated = await HostelRoom.findById(doc._id).populate('hostelId', 'name hostelType').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    hostelId: String(populated.hostelId?._id || populated.hostelId),
    hostelName: populated.hostelId?.name,
    hostelType: populated.hostelId?.hostelType,
  });
});

// PUT /api/hostel-rooms/:id
hostelRoomsRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await HostelRoom.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const b = req.body || {};
  if (b.roomNo != null) doc.roomNo = (b.roomNo || '').toString().trim();
  if (b.roomType != null) {
    const rt = (b.roomType || '').toString().toLowerCase();
    if (['single', 'double', 'triple', 'dormitory'].includes(rt)) doc.roomType = rt;
  }
  if (b.seatTotal != null) {
    const st = parseInt(b.seatTotal, 10);
    if (!isNaN(st) && st >= 1) doc.seatTotal = st;
  }
  if (b.hostelId != null) {
    const hid = (b.hostelId || '').toString().trim();
    const hostel = await Hostel.findOne({ _id: hid, academicYearId });
    if (hostel) doc.hostelId = hid;
  }
  if (b.costPerSeat != null) doc.costPerSeat = parseFloat(b.costPerSeat) || 0;
  if (b.note != null) doc.note = (b.note || '').toString().trim();

  await doc.save();
  const populated = await HostelRoom.findById(doc._id).populate('hostelId', 'name hostelType').lean();
  res.json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    hostelId: String(populated.hostelId?._id || populated.hostelId),
    hostelName: populated.hostelId?.name,
    hostelType: populated.hostelId?.hostelType,
  });
});

// DELETE /api/hostel-rooms/:id
hostelRoomsRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await HostelRoom.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  await HostelRoom.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
