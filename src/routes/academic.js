import express from 'express';
import { AcademicClass } from '../models/AcademicClass.js';
import { AcademicSection } from '../models/AcademicSection.js';
import { AcademicSubject } from '../models/AcademicSubject.js';
import { TeacherAssignment } from '../models/TeacherAssignment.js';
import { AcademicCalendar } from '../models/AcademicCalendar.js';
import { Syllabus } from '../models/Syllabus.js';
import { LessonPlan } from '../models/LessonPlan.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const academicRouter = express.Router();

// ----- Classes ----- //
academicRouter.get('/classes', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const items = await AcademicClass.find({ academicYearId }).sort({ name: 1 }).lean();
  res.json({ items });
});

academicRouter.post('/classes', async (req, res) => {
  const { name, code, academicYearId } = req.body || {};
  if (!name || !academicYearId) {
    return res
      .status(400)
      .json({ message: 'name and academicYearId are required' });
  }
  const ensuredYearId = await ensureCurrentAcademicYear(req, res);
  if (!ensuredYearId) return;

  const doc = await AcademicClass.create({ name, code, academicYearId: ensuredYearId });
  res.status(201).json(doc.toObject());
});

academicRouter.put('/classes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, code } = req.body || {};
  const updated = await AcademicClass.findByIdAndUpdate(
    id,
    { ...(name != null ? { name } : {}), ...(code != null ? { code } : {}) },
    { new: true, runValidators: true },
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated.toObject());
});

academicRouter.delete('/classes/:id', async (req, res) => {
  const { id } = req.params;
  await AcademicClass.findByIdAndDelete(id);
  res.status(204).send();
});

// ----- Sections ----- //
academicRouter.get('/sections', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const classId = (req.query.classId || '').toString();

  const query = { academicYearId };
  if (classId) query.classId = classId;

  const items = await AcademicSection.find(query).sort({ name: 1 }).lean();
  res.json({ items });
});

academicRouter.post('/sections', async (req, res) => {
  const { name, academicYearId, classId } = req.body || {};
  if (!name || !academicYearId || !classId) {
    return res
      .status(400)
      .json({ message: 'name, classId and academicYearId are required' });
  }
  const ensuredYearId = await ensureCurrentAcademicYear(req, res);
  if (!ensuredYearId) return;

  const doc = await AcademicSection.create({ name, academicYearId: ensuredYearId, classId });
  res.status(201).json(doc.toObject());
});

academicRouter.put('/sections/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body || {};
  const updated = await AcademicSection.findByIdAndUpdate(
    id,
    { ...(name != null ? { name } : {}) },
    { new: true, runValidators: true },
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated.toObject());
});

academicRouter.delete('/sections/:id', async (req, res) => {
  const { id } = req.params;
  await AcademicSection.findByIdAndDelete(id);
  res.status(204).send();
});

// ----- Subjects ----- //
academicRouter.get('/subjects', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const items = await AcademicSubject.find({ academicYearId }).sort({ name: 1 }).lean();
  res.json({ items });
});

academicRouter.post('/subjects', async (req, res) => {
  const { name, alias, code, shortCode, type, description, academicYearId } = req.body || {};
  if (!name || !academicYearId) {
    return res.status(400).json({ message: 'name and academicYearId are required' });
  }
  const ensuredYearId = await ensureCurrentAcademicYear(req, res);
  if (!ensuredYearId) return;

  const doc = await AcademicSubject.create({
    name: String(name).trim(),
    alias: String(alias || '').trim(),
    code: String(code || '').trim(),
    shortCode: String(shortCode || '').trim(),
    type: String(type || '').trim(),
    description: String(description || '').trim(),
    academicYearId: ensuredYearId,
  });
  res.status(201).json(doc.toObject());
});

academicRouter.put('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, alias, code, shortCode, type, description } = req.body || {};
  const update = {};
  if (name != null) update.name = String(name).trim();
  if (alias != null) update.alias = String(alias).trim();
  if (code != null) update.code = String(code).trim();
  if (shortCode != null) update.shortCode = String(shortCode).trim();
  if (type != null) update.type = String(type).trim();
  if (description != null) update.description = String(description).trim();
  const updated = await AcademicSubject.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated.toObject());
});

academicRouter.delete('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  await AcademicSubject.findByIdAndDelete(id);
  res.status(204).send();
});

// ----- Teacher Assignments ----- //
academicRouter.get('/teacher-assignments', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const items = await TeacherAssignment.find({ academicYearId })
    .populate('staffId', 'fullName')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name')
    .lean();
  res.json({ items });
});

academicRouter.post('/teacher-assignments', async (req, res) => {
  const { academicYearId, staffId, classId, sectionId, subjectId } = req.body || {};
  if (!academicYearId || !staffId || !classId || !sectionId || !subjectId) {
    return res
      .status(400)
      .json({ message: 'academicYearId, staffId, classId, sectionId, subjectId are required' });
  }
  const ensuredYearId = await ensureCurrentAcademicYear(req, res);
  if (!ensuredYearId) return;

  const doc = await TeacherAssignment.create({
    academicYearId: ensuredYearId,
    staffId,
    classId,
    sectionId,
    subjectId,
  });
  res.status(201).json(doc.toObject());
});

academicRouter.delete('/teacher-assignments/:id', async (req, res) => {
  const { id } = req.params;
  await TeacherAssignment.findByIdAndDelete(id);
  res.status(204).send();
});

// ----- Academic Calendar ----- //
academicRouter.get('/calendar', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const eventType = (req.query.eventType || '').toString().trim();

  const query = { academicYearId };
  if (from || to) {
    query.eventDate = {};
    if (from) query.eventDate.$gte = from;
    if (to) query.eventDate.$lte = to;
  }
  if (eventType) query.eventType = eventType;

  const items = await AcademicCalendar.find(query)
    .sort({ eventDate: 1 })
    .lean();
  res.json({ items });
});

academicRouter.post('/calendar', async (req, res) => {
  const { title, description, eventDate, eventType, academicYearId } =
    req.body || {};
  if (!title || !eventDate || !academicYearId) {
    return res
      .status(400)
      .json({ message: 'title, eventDate and academicYearId are required' });
  }
  const ensuredYearId = await ensureCurrentAcademicYear(req, res);
  if (!ensuredYearId) return;

  const doc = await AcademicCalendar.create({
    title,
    description,
    eventDate: new Date(eventDate),
    eventType: eventType || 'event',
    academicYearId: ensuredYearId,
  });
  res.status(201).json(doc.toObject());
});

academicRouter.put('/calendar/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, eventDate, eventType } = req.body || {};
  const updated = await AcademicCalendar.findByIdAndUpdate(
    id,
    {
      ...(title != null ? { title } : {}),
      ...(description != null ? { description } : {}),
      ...(eventDate != null ? { eventDate: new Date(eventDate) } : {}),
      ...(eventType != null ? { eventType } : {}),
    },
    { new: true, runValidators: true },
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated.toObject());
});

academicRouter.delete('/calendar/:id', async (req, res) => {
  const { id } = req.params;
  await AcademicCalendar.findByIdAndDelete(id);
  res.status(204).send();
});

// ----- Syllabus ----- //
academicRouter.get('/syllabus', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const subjectId = (req.query.subjectId || '').toString();
  const classId = (req.query.classId || '').toString();

  const query = { academicYearId };
  if (subjectId) query.subjectId = subjectId;
  if (classId) query.classId = classId;

  const items = await Syllabus.find(query)
    .populate('subjectId', 'name')
    .populate('classId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ items });
});

academicRouter.post('/syllabus', async (req, res) => {
  const {
    title,
    description,
    subjectId,
    classId,
    academicYearId,
    chapters,
  } = req.body || {};
  if (!title || !subjectId || !classId || !academicYearId) {
    return res.status(400).json({
      message: 'title, subjectId, classId and academicYearId are required',
    });
  }
  const ensuredYearId = await ensureCurrentAcademicYear(req, res);
  if (!ensuredYearId) return;

  const doc = await Syllabus.create({
    title,
    description,
    subjectId,
    classId,
    academicYearId: ensuredYearId,
    chapters: chapters || [],
  });
  res.status(201).json(doc.toObject());
});

academicRouter.put('/syllabus/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, chapters } = req.body || {};
  const updated = await Syllabus.findByIdAndUpdate(
    id,
    {
      ...(title != null ? { title } : {}),
      ...(description != null ? { description } : {}),
      ...(chapters != null ? { chapters } : {}),
    },
    { new: true, runValidators: true },
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated.toObject());
});

academicRouter.delete('/syllabus/:id', async (req, res) => {
  const { id } = req.params;
  await Syllabus.findByIdAndDelete(id);
  res.status(204).send();
});

// ----- Lesson Plans ----- //
academicRouter.get('/lesson-plans', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const staffId = (req.query.staffId || '').toString();
  const classId = (req.query.classId || '').toString();
  const sectionId = (req.query.sectionId || '').toString();
  const subjectId = (req.query.subjectId || '').toString();
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;

  const query = { academicYearId };
  if (staffId) query.staffId = staffId;
  if (classId) query.classId = classId;
  if (sectionId) query.sectionId = sectionId;
  if (subjectId) query.subjectId = subjectId;
  if (from || to) {
    query.plannedDate = {};
    if (from) query.plannedDate.$gte = from;
    if (to) query.plannedDate.$lte = to;
  }

  const items = await LessonPlan.find(query)
    .populate('staffId', 'fullName')
    .populate('subjectId', 'name')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .sort({ plannedDate: 1 })
    .lean();
  res.json({ items });
});

academicRouter.post('/lesson-plans', async (req, res) => {
  const {
    title,
    description,
    subjectId,
    classId,
    sectionId,
    staffId,
    academicYearId,
    plannedDate,
    duration,
    objectives,
    materials,
    activities,
    homework,
    status,
  } = req.body || {};
  if (
    !title ||
    !subjectId ||
    !classId ||
    !sectionId ||
    !staffId ||
    !academicYearId ||
    !plannedDate
  ) {
    return res.status(400).json({
      message:
        'title, subjectId, classId, sectionId, staffId, academicYearId and plannedDate are required',
    });
  }
  const ensuredYearId = await ensureCurrentAcademicYear(req, res);
  if (!ensuredYearId) return;

  const doc = await LessonPlan.create({
    title,
    description,
    subjectId,
    classId,
    sectionId,
    staffId,
    academicYearId: ensuredYearId,
    plannedDate: new Date(plannedDate),
    duration: duration ?? 40,
    objectives: objectives || [],
    materials: materials || [],
    activities: activities || [],
    homework,
    status: status || 'planned',
  });
  res.status(201).json(doc.toObject());
});

academicRouter.put('/lesson-plans/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const updated = await LessonPlan.findByIdAndUpdate(
    id,
    {
      ...(body.title != null ? { title: body.title } : {}),
      ...(body.description != null ? { description: body.description } : {}),
      ...(body.plannedDate != null
        ? { plannedDate: new Date(body.plannedDate) }
        : {}),
      ...(body.duration != null ? { duration: body.duration } : {}),
      ...(body.objectives != null ? { objectives: body.objectives } : {}),
      ...(body.materials != null ? { materials: body.materials } : {}),
      ...(body.activities != null ? { activities: body.activities } : {}),
      ...(body.homework != null ? { homework: body.homework } : {}),
      ...(body.status != null ? { status: body.status } : {}),
    },
    { new: true, runValidators: true },
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated.toObject());
});

academicRouter.delete('/lesson-plans/:id', async (req, res) => {
  const { id } = req.params;
  await LessonPlan.findByIdAndDelete(id);
  res.status(204).send();
});

