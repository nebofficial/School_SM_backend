import express from 'express';
import { CompetencyMark } from '../models/CompetencyMark.js';
import { ExamSchedule } from '../models/ExamSchedule.js';
import { Registration } from '../models/Registration.js';
import { AcademicClass } from '../models/AcademicClass.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const competencyMarksRouter = express.Router();

/**
 * GET /api/competency-marks?academicYearId= & examScheduleId=
 * Returns list of students with competency marks for the given schedule.
 */
competencyMarksRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const examScheduleId = (req.query.examScheduleId || '').toString();
  if (!examScheduleId) {
    return res.status(400).json({ message: 'examScheduleId is required' });
  }

  const schedule = await ExamSchedule.findById(examScheduleId)
    .populate('examId', 'name')
    .populate('classId', 'name code')
    .lean();
  if (!schedule) {
    return res.status(404).json({ message: 'Exam schedule not found' });
  }

  const cls = await AcademicClass.findOne({
    _id: schedule.classId._id || schedule.classId,
    academicYearId,
  }).lean();
  if (!cls) {
    return res
      .status(400)
      .json({ message: 'Schedule class does not belong to current academic year' });
  }

  const classId = schedule.classId._id || schedule.classId;
  const students = await Registration.find({ classId, status: 'active' })
    .sort({ rollNo: 1, firstName: 1 })
    .lean();

  const marks = await CompetencyMark.find({
    academicYearId,
    examScheduleId,
  }).lean();

  const marksByReg = {};
  for (const m of marks) {
    marksByReg[String(m.registrationId)] = m.marksObtained;
  }

  const items = students.map((s) => ({
    registrationId: String(s._id),
    admissionNumber: s.admissionNumber,
    rollNo: s.rollNo,
    fullName: [s.firstName, s.lastName].filter(Boolean).join(' '),
    marksObtained: marksByReg[String(s._id)] ?? null,
  }));

  res.json({
    examScheduleId,
    examName: schedule.examId?.name,
    className: schedule.classId?.name,
    items,
  });
});

/**
 * POST /api/competency-marks/bulk
 * Body: { academicYearId, examScheduleId, marks: [ { registrationId, marksObtained } ] }
 */
competencyMarksRouter.post('/bulk', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const body = req.body || {};
  const examScheduleId = (body.examScheduleId || '').toString();
  const marksInput = Array.isArray(body.marks) ? body.marks : [];

  if (!examScheduleId) {
    return res.status(400).json({ message: 'examScheduleId is required' });
  }

  const schedule = await ExamSchedule.findById(examScheduleId)
    .populate('classId')
    .lean();
  if (!schedule) {
    return res.status(404).json({ message: 'Exam schedule not found' });
  }

  const cls = await AcademicClass.findOne({
    _id: schedule.classId._id || schedule.classId,
    academicYearId,
  }).lean();
  if (!cls) {
    return res
      .status(400)
      .json({ message: 'Schedule class does not belong to current academic year' });
  }

  let upserted = 0;
  for (const row of marksInput) {
    const registrationId = (row.registrationId || '').toString();
    if (!registrationId) continue;

    const marksObtained = row.marksObtained != null ? Number(row.marksObtained) : null;

    await CompetencyMark.findOneAndUpdate(
      { examScheduleId, registrationId },
      {
        $set: {
          academicYearId,
          examScheduleId,
          registrationId,
          marksObtained,
        },
      },
      { upsert: true }
    );
    upserted += 1;
  }

  res.json({ ok: true, upserted });
});
