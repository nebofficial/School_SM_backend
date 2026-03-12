import express from 'express';
import { ExamSchedule } from '../models/ExamSchedule.js';
import { Registration } from '../models/Registration.js';
import { AcademicClass } from '../models/AcademicClass.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const admitCardsRouter = express.Router();

/**
 * GET /api/admit-cards?academicYearId= & examId= & classId=
 * Returns list of students (registrations) in the class with exam/schedule info for admit card generation.
 */
admitCardsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const examId = (req.query.examId || '').toString();
  const classId = (req.query.classId || '').toString();
  if (!examId || !classId) {
    return res.status(400).json({
      message: 'examId and classId are required',
    });
  }

  const cls = await AcademicClass.findOne({
    _id: classId,
    academicYearId,
  }).lean();
  if (!cls) {
    return res
      .status(400)
      .json({ message: 'classId must belong to the current academic year' });
  }

  const schedules = await ExamSchedule.find({
    examId,
    classId,
  })
    .populate('examId', 'name code')
    .populate('classId', 'name code')
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  const scheduleInfo = schedules[0] || null;

  const students = await Registration.find({
    classId,
    status: 'active',
  })
    .sort({ rollNo: 1, firstName: 1 })
    .lean();

  const items = students.map((s) => ({
    registrationId: String(s._id),
    admissionNumber: s.admissionNumber,
    rollNo: s.rollNo,
    firstName: s.firstName,
    lastName: s.lastName,
    fullName: [s.firstName, s.lastName].filter(Boolean).join(' '),
    photoUrl: s.photoUrl,
    classId: cls.name,
    classCode: cls.code,
  }));

  res.json({
    examId,
    classId,
    examName: scheduleInfo?.examId?.name,
    className: scheduleInfo?.classId?.name || cls.name,
    schedule: scheduleInfo
      ? {
          startDate: scheduleInfo.startDate,
          endDate: scheduleInfo.endDate,
          lastExamDate: scheduleInfo.lastExamDate,
          additionalSubjects: scheduleInfo.additionalSubjects || [],
        }
      : null,
    items,
  });
});
