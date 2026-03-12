import express from 'express';
import { ExamMark } from '../models/ExamMark.js';
import { ExamSchedule } from '../models/ExamSchedule.js';
import { Registration } from '../models/Registration.js';
import { AcademicClass } from '../models/AcademicClass.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const examMarksRouter = express.Router();

/**
 * GET /api/exam-marks?academicYearId= & examScheduleId=
 * Returns list of marks for the given schedule. Optionally returns student list with marks per subject.
 */
examMarksRouter.get('/', async (req, res) => {
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

  const marks = await ExamMark.find({
    academicYearId,
    examScheduleId,
  }).lean();

  const marksByReg = {};
  for (const m of marks) {
    const rid = String(m.registrationId);
    if (!marksByReg[rid]) marksByReg[rid] = [];
    marksByReg[rid].push({
      _id: String(m._id),
      subjectCode: m.subjectCode,
      subjectName: m.subjectName,
      maxMarks: m.maxMarks,
      marksObtained: m.marksObtained,
      gradeCode: m.gradeCode,
    });
  }

  const items = students.map((s) => ({
    registrationId: String(s._id),
    admissionNumber: s.admissionNumber,
    rollNo: s.rollNo,
    firstName: s.firstName,
    lastName: s.lastName,
    fullName: [s.firstName, s.lastName].filter(Boolean).join(' '),
    marks: marksByReg[String(s._id)] || [],
  }));

  res.json({
    examScheduleId,
    examName: schedule.examId?.name,
    className: schedule.classId?.name,
    items,
  });
});

/**
 * POST /api/exam-marks/bulk
 * Body: { academicYearId, examScheduleId, marks: [ { registrationId, subjectCode, subjectName, maxMarks, marksObtained, gradeCode? } ] }
 * Upserts marks (one per registration + subjectCode).
 */
examMarksRouter.post('/bulk', async (req, res) => {
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
    const subjectCode = String(row.subjectCode || '').trim();
    if (!registrationId || !subjectCode) continue;

    const maxMarks = Number(row.maxMarks) ?? 0;
    const marksObtained = row.marksObtained != null ? Number(row.marksObtained) : null;
    const subjectName = String(row.subjectName || '').trim();
    const gradeCode = String(row.gradeCode || '').trim();

    await ExamMark.findOneAndUpdate(
      {
        examScheduleId,
        registrationId,
        subjectCode,
      },
      {
        $set: {
          academicYearId,
          examScheduleId,
          registrationId,
          subjectCode,
          subjectName,
          maxMarks,
          marksObtained,
          gradeCode,
        },
      },
      { upsert: true }
    );
    upserted += 1;
  }

  res.json({ ok: true, upserted });
});
