import express from 'express';
import { StaffAttendance } from '../models/StaffAttendance.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const staffAttendanceRouter = express.Router();

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// GET /api/staff-attendance?academicYearId=&staffId=&date=&from=&to=
staffAttendanceRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const staffId = (req.query.staffId || '').toString();
  const date = req.query.date ? new Date(req.query.date) : null;
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;

  const query = { academicYearId };
  if (staffId) query.staffId = staffId;
  if (date) {
    query.date = { $gte: startOfDay(date), $lte: endOfDay(date) };
  } else if (from || to) {
    query.date = {};
    if (from) query.date.$gte = startOfDay(from);
    if (to) {
      query.date.$lte = endOfDay(to);
    }
  }

  const items = await StaffAttendance.find(query)
    .populate('staffId', 'fullName')
    .sort({ date: -1 })
    .lean();
  res.json({ items });
});

// POST /api/staff-attendance
staffAttendanceRouter.post('/', async (req, res) => {
  const { staffId, academicYearId, date, status, method, checkIn, checkOut, notes } =
    req.body || {};
  if (!staffId || !academicYearId || !date) {
    return res
      .status(400)
      .json({ message: 'staffId, academicYearId and date are required' });
  }

  const ensuredYearId = await ensureCurrentAcademicYear(
    { ...req, body: { ...req.body, academicYearId } },
    res,
  );
  if (!ensuredYearId) return;

  const doc = await StaffAttendance.create({
    staffId,
    academicYearId: ensuredYearId,
    date: startOfDay(new Date(date)),
    status: status || 'present',
    method: method || 'manual',
    checkIn: checkIn ? new Date(checkIn) : undefined,
    checkOut: checkOut ? new Date(checkOut) : undefined,
    notes,
  });
  res.status(201).json(doc.toObject());
});

// PUT /api/staff-attendance/:id
staffAttendanceRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, method, checkIn, checkOut, notes } = req.body || {};
  const updated = await StaffAttendance.findByIdAndUpdate(
    id,
    {
      ...(status != null ? { status } : {}),
      ...(method != null ? { method } : {}),
      ...(checkIn != null ? { checkIn: checkIn ? new Date(checkIn) : null } : {}),
      ...(checkOut != null ? { checkOut: checkOut ? new Date(checkOut) : null } : {}),
      ...(notes != null ? { notes } : {}),
    },
    { new: true, runValidators: true },
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated.toObject());
});

// DELETE /api/staff-attendance/:id
staffAttendanceRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await StaffAttendance.findByIdAndDelete(id);
  res.status(204).send();
});

// POST /api/staff-attendance/bulk
// Body: { academicYearId, date, method?, items: [{ staffId, status, checkIn?, checkOut?, notes?, method? }] }
staffAttendanceRouter.post('/bulk', async (req, res) => {
  const { academicYearId, date, method, items } = req.body || {};
  if (!academicYearId || !date) {
    return res.status(400).json({ message: 'academicYearId and date are required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items must be a non-empty array' });
  }

  const ensuredYearId = await ensureCurrentAcademicYear(
    { ...req, body: { ...req.body, academicYearId } },
    res,
  );
  if (!ensuredYearId) return;

  const day = startOfDay(new Date(date));
  const ops = [];
  for (const row of items) {
    if (!row || !row.staffId) {
      return res.status(400).json({ message: 'Each item must include staffId' });
    }
    ops.push({
      updateOne: {
        filter: {
          academicYearId: ensuredYearId,
          staffId: row.staffId,
          date: day,
        },
        update: {
          $set: {
            academicYearId: ensuredYearId,
            staffId: row.staffId,
            date: day,
            status: row.status || 'present',
            method: row.method || method || 'manual',
            checkIn: row.checkIn ? new Date(row.checkIn) : undefined,
            checkOut: row.checkOut ? new Date(row.checkOut) : undefined,
            notes: row.notes,
          },
        },
        upsert: true,
      },
    });
  }

  const result = await StaffAttendance.bulkWrite(ops, { ordered: false });
  res.json({ ok: true, result });
});
