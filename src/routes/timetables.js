import express from 'express';
import { Timetable } from '../models/Timetable.js';
import { AcademicClass } from '../models/AcademicClass.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const timetablesRouter = express.Router();

timetablesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const classId = (req.query.classId || '').toString();
  const classQuery = { academicYearId };
  if (classId) classQuery._id = classId;

  const classIds = await AcademicClass.find(classQuery).distinct('_id');
  const query = { classId: { $in: classIds } };

  const items = await Timetable.find(query)
    .populate('classId', 'name')
    .populate('roomId', 'name block floor')
    .populate('dailyConfig.classTimingId', 'name')
    .sort({ effectiveDate: -1, createdAt: -1 })
    .lean();
  res.json({ items });
});

timetablesRouter.get('/:id', async (req, res) => {
  const doc = await Timetable.findById(req.params.id)
    .populate('classId', 'name')
    .populate('roomId', 'name block floor')
    .populate('dailyConfig.classTimingId', 'name')
    .lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

timetablesRouter.post('/', async (req, res) => {
  const { academicYearId, classId, roomId, effectiveDate, description, dailyConfig } =
    req.body || {};
  if (!academicYearId)
    return res.status(400).json({ message: 'academicYearId is required' });
  if (!classId)
    return res.status(400).json({ message: 'classId is required' });
  if (!effectiveDate)
    return res.status(400).json({ message: 'effectiveDate is required' });

  const ensuredYearId = await ensureCurrentAcademicYear(req, res);
  if (!ensuredYearId) return;

  const cls = await AcademicClass.findOne({
    _id: classId,
    academicYearId: ensuredYearId,
  }).lean();
  if (!cls) {
    return res.status(400).json({
      message: 'classId must belong to the current academic year',
    });
  }

  const dc = Array.isArray(dailyConfig)
    ? dailyConfig.map((d) => ({
        day: DAYS.includes(String(d.day || '').toLowerCase()) ? String(d.day).toLowerCase() : 'monday',
        holiday: Boolean(d.holiday),
        classTimingId: d.classTimingId || null,
      }))
    : DAYS.map((day) => ({ day, holiday: false, classTimingId: null }));

  const doc = await Timetable.create({
    classId,
    roomId: roomId || null,
    effectiveDate: new Date(effectiveDate),
    description: String(description || '').trim(),
    dailyConfig: dc,
  });
  const populated = await Timetable.findById(doc._id)
    .populate('classId', 'name')
    .populate('roomId', 'name block floor')
    .populate('dailyConfig.classTimingId', 'name')
    .lean();
  res.status(201).json(populated);
});

timetablesRouter.put('/:id', async (req, res) => {
  const { academicYearId, classId, roomId, effectiveDate, description, dailyConfig } =
    req.body || {};
  if (!academicYearId)
    return res.status(400).json({ message: 'academicYearId is required' });

  const ensuredYearId = await ensureCurrentAcademicYear(req, res);
  if (!ensuredYearId) return;

  if (classId != null) {
    const cls = await AcademicClass.findOne({
      _id: classId,
      academicYearId: ensuredYearId,
    }).lean();
    if (!cls) {
      return res.status(400).json({
        message: 'classId must belong to the current academic year',
      });
    }
  }

  const update = {};
  if (classId != null) update.classId = classId;
  if (roomId != null) update.roomId = roomId;
  if (effectiveDate != null) update.effectiveDate = new Date(effectiveDate);
  if (description != null) update.description = String(description).trim();
  if (dailyConfig != null) {
    update.dailyConfig = Array.isArray(dailyConfig)
      ? dailyConfig.map((d) => ({
          day: DAYS.includes(String(d.day || '').toLowerCase())
            ? String(d.day).toLowerCase()
            : 'monday',
          holiday: Boolean(d.holiday),
          classTimingId: d.classTimingId || null,
        }))
      : [];
  }
  const doc = await Timetable.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  })
    .populate('classId', 'name')
    .populate('roomId', 'name block floor')
    .populate('dailyConfig.classTimingId', 'name')
    .lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

timetablesRouter.delete('/:id', async (req, res) => {
  const doc = await Timetable.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
