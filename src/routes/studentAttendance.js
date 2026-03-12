import express from 'express';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';
import { StudentAttendance } from '../models/StudentAttendance.js';
import { Registration } from '../models/Registration.js';
import { AcademicClass } from '../models/AcademicClass.js';

export const studentAttendanceRouter = express.Router();

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

async function ensureRegistrationBelongsToYear({
  registrationId,
  academicYearId,
  classIdHint,
}) {
  const reg = await Registration.findById(registrationId).lean();
  if (!reg) return { ok: false, message: 'registrationId not found' };
  const classId = reg.classId || null;
  if (!classId) return { ok: false, message: 'Student must be assigned to a class' };

  if (classIdHint && String(classIdHint) !== String(classId)) {
    return { ok: false, message: 'registrationId does not belong to the selected class' };
  }

  const cls = await AcademicClass.findOne({ _id: classId, academicYearId }).lean();
  if (!cls) {
    return { ok: false, message: 'Student class must belong to the current academic year' };
  }
  return { ok: true, classId: cls._id };
}

// GET /api/student-attendance?academicYearId=&classId=&registrationId=&date=&from=&to=
studentAttendanceRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const classId = (req.query.classId || '').toString();
  const registrationId = (req.query.registrationId || '').toString();
  const date = req.query.date ? new Date(req.query.date) : null;
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;

  const query = { academicYearId };
  if (classId) query.classId = classId;
  if (registrationId) query.registrationId = registrationId;
  if (date) query.date = { $gte: startOfDay(date), $lte: endOfDay(date) };
  else if (from || to) {
    query.date = {};
    if (from) query.date.$gte = startOfDay(from);
    if (to) query.date.$lte = endOfDay(to);
  }

  const items = await StudentAttendance.find(query)
    .populate('registrationId', 'firstName lastName regNumber classId')
    .populate('classId', 'name')
    .sort({ date: -1 })
    .lean();

  res.json({ items });
});

// POST /api/student-attendance
studentAttendanceRouter.post('/', async (req, res) => {
  const {
    registrationId,
    academicYearId,
    date,
    status,
    method,
    checkIn,
    checkOut,
    notes,
  } = req.body || {};

  if (!registrationId || !academicYearId || !date) {
    return res.status(400).json({
      message: 'registrationId, academicYearId and date are required',
    });
  }

  const ensuredYearId = await ensureCurrentAcademicYear(
    { ...req, body: { ...req.body, academicYearId } },
    res,
  );
  if (!ensuredYearId) return;

  const regCheck = await ensureRegistrationBelongsToYear({
    registrationId,
    academicYearId: ensuredYearId,
  });
  if (!regCheck.ok) return res.status(400).json({ message: regCheck.message });

  const doc = await StudentAttendance.create({
    registrationId,
    classId: regCheck.classId,
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

// PUT /api/student-attendance/:id
studentAttendanceRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, method, checkIn, checkOut, notes } = req.body || {};
  const updated = await StudentAttendance.findByIdAndUpdate(
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

// DELETE /api/student-attendance/:id
studentAttendanceRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await StudentAttendance.findByIdAndDelete(id);
  res.status(204).send();
});

// POST /api/student-attendance/bulk
// Body: { academicYearId, date, classId?, method?, items: [{ registrationId, status, checkIn?, checkOut?, notes? }] }
studentAttendanceRouter.post('/bulk', async (req, res) => {
  const { academicYearId, date, classId, method, items } = req.body || {};
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
    if (!row || !row.registrationId) {
      return res.status(400).json({ message: 'Each item must include registrationId' });
    }
    const regCheck = await ensureRegistrationBelongsToYear({
      registrationId: row.registrationId,
      academicYearId: ensuredYearId,
      classIdHint: classId,
    });
    if (!regCheck.ok) return res.status(400).json({ message: regCheck.message });

    ops.push({
      updateOne: {
        filter: {
          academicYearId: ensuredYearId,
          registrationId: row.registrationId,
          date: day,
        },
        update: {
          $set: {
            academicYearId: ensuredYearId,
            registrationId: row.registrationId,
            classId: regCheck.classId,
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

  const result = await StudentAttendance.bulkWrite(ops, { ordered: false });
  res.json({ ok: true, result });
});

