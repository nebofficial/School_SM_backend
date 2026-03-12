import express from 'express';
import { ExamResult } from '../models/ExamResult.js';
import { ExamMark } from '../models/ExamMark.js';
import { ExamSchedule } from '../models/ExamSchedule.js';
import { ExamGrade } from '../models/ExamGrade.js';
import { Registration } from '../models/Registration.js';
import { AcademicClass } from '../models/AcademicClass.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const examResultsRouter = express.Router();

function findGradeForPercentage(gradeRecords, percentage) {
  if (!Array.isArray(gradeRecords) || gradeRecords.length === 0) return null;
  const p = Number(percentage);
  const sorted = [...gradeRecords].sort((a, b) => (a.minScore ?? 0) - (b.minScore ?? 0));
  for (const g of sorted) {
    const min = Number(g.minScore) ?? 0;
    const max = Number(g.maxScore) ?? 100;
    if (p >= min && p <= max) return g;
  }
  return sorted[sorted.length - 1] || null;
}

/**
 * POST /api/exam-results/generate
 * Body: { academicYearId, examScheduleId }
 * Computes results from ExamMark and writes ExamResult (total, percentage, grade from schedule's examGradeId).
 */
examResultsRouter.post('/generate', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const examScheduleId = (req.body?.examScheduleId || '').toString();
  if (!examScheduleId) {
    return res.status(400).json({ message: 'examScheduleId is required' });
  }

  const schedule = await ExamSchedule.findById(examScheduleId)
    .populate('classId')
    .populate('examGradeId')
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
  const students = await Registration.find({ classId, status: 'active' }).lean();
  const gradeRecords = schedule.examGradeId?.grades || [];
  let generated = 0;

  for (const s of students) {
    const marks = await ExamMark.find({
      academicYearId,
      examScheduleId,
      registrationId: s._id,
    }).lean();

    let totalMarks = 0;
    let maxTotalMarks = 0;
    for (const m of marks) {
      const max = Number(m.maxMarks) ?? 0;
      const ob = m.marksObtained != null ? Number(m.marksObtained) : 0;
      maxTotalMarks += max;
      totalMarks += ob;
    }

    const percentage =
      maxTotalMarks > 0 ? Math.round((totalMarks / maxTotalMarks) * 10000) / 100 : 0;
    const gradeInfo = findGradeForPercentage(gradeRecords, percentage);
    const gradeCode = gradeInfo?.code ?? '';
    const isPass = gradeInfo ? !gradeInfo.failGrade : percentage >= 33;

    await ExamResult.findOneAndUpdate(
      { examScheduleId, registrationId: s._id },
      {
        $set: {
          academicYearId,
          examScheduleId,
          registrationId: s._id,
          totalMarks,
          maxTotalMarks,
          percentage,
          gradeCode,
          isPass,
        },
      },
      { upsert: true }
    );
    generated += 1;
  }

  res.json({ ok: true, generated });
});

/**
 * GET /api/exam-results?academicYearId= & examScheduleId=
 * List results for the schedule.
 */
examResultsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const examScheduleId = (req.query.examScheduleId || '').toString();
  if (!examScheduleId) {
    return res.status(400).json({ message: 'examScheduleId is required' });
  }

  const schedule = await ExamSchedule.findById(examScheduleId)
    .populate('examId', 'name')
    .populate('classId', 'name')
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

  const results = await ExamResult.find({
    academicYearId,
    examScheduleId,
  })
    .populate('registrationId', 'admissionNumber rollNo firstName lastName')
    .sort({ 'registrationId.rollNo': 1 })
    .lean();

  const items = results.map((r) => {
    const reg = r.registrationId;
    return {
      _id: String(r._id),
      registrationId: String(r.registrationId._id || r.registrationId),
      admissionNumber: reg?.admissionNumber,
      rollNo: reg?.rollNo,
      firstName: reg?.firstName,
      lastName: reg?.lastName,
      fullName: [reg?.firstName, reg?.lastName].filter(Boolean).join(' '),
      totalMarks: r.totalMarks,
      maxTotalMarks: r.maxTotalMarks,
      percentage: r.percentage,
      gradeCode: r.gradeCode,
      isPass: r.isPass,
    };
  });

  res.json({
    examScheduleId,
    examName: schedule.examId?.name,
    className: schedule.classId?.name,
    items,
  });
});

/**
 * GET /api/exam-results/report-card?academicYearId= & registrationId= & examScheduleId=
 * Single student report card: result + subject-wise marks.
 */
examResultsRouter.get('/report-card', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const registrationId = (req.query.registrationId || '').toString();
  const examScheduleId = (req.query.examScheduleId || '').toString();
  if (!registrationId || !examScheduleId) {
    return res
      .status(400)
      .json({ message: 'registrationId and examScheduleId are required' });
  }

  const [result, marks, schedule] = await Promise.all([
    ExamResult.findOne({
      academicYearId,
      examScheduleId,
      registrationId,
    }).lean(),
    ExamMark.find({
      academicYearId,
      examScheduleId,
      registrationId,
    })
      .sort({ subjectCode: 1 })
      .lean(),
    ExamSchedule.findById(examScheduleId)
      .populate('examId', 'name')
      .populate('classId', 'name')
      .lean(),
  ]);

  const student = await Registration.findById(registrationId)
    .populate('classId', 'name code')
    .lean();
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  res.json({
    student: {
      registrationId: String(student._id),
      admissionNumber: student.admissionNumber,
      rollNo: student.rollNo,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: [student.firstName, student.lastName].filter(Boolean).join(' '),
      classId: student.classId?.name,
    },
    exam: schedule?.examId?.name,
    className: schedule?.classId?.name,
    result: result
      ? {
          totalMarks: result.totalMarks,
          maxTotalMarks: result.maxTotalMarks,
          percentage: result.percentage,
          gradeCode: result.gradeCode,
          isPass: result.isPass,
        }
      : null,
    marks: marks.map((m) => ({
      subjectCode: m.subjectCode,
      subjectName: m.subjectName,
      maxMarks: m.maxMarks,
      marksObtained: m.marksObtained,
      gradeCode: m.gradeCode,
    })),
  });
});

/**
 * GET /api/exam-results/analysis?academicYearId= & examScheduleId=
 * Aggregates: totalStudents, passed, failed, passPercentage, subjectWise (avg, min, max per subject).
 */
examResultsRouter.get('/analysis', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const examScheduleId = (req.query.examScheduleId || '').toString();
  if (!examScheduleId) {
    return res.status(400).json({ message: 'examScheduleId is required' });
  }

  const schedule = await ExamSchedule.findById(examScheduleId)
    .populate('examId', 'name')
    .populate('classId', 'name')
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

  const results = await ExamResult.find({
    academicYearId,
    examScheduleId,
  }).lean();

  const totalStudents = results.length;
  const passed = results.filter((r) => r.isPass).length;
  const failed = totalStudents - passed;
  const passPercentage =
    totalStudents > 0 ? Math.round((passed / totalStudents) * 10000) / 100 : 0;

  const marks = await ExamMark.find({
    academicYearId,
    examScheduleId,
  }).lean();

  const bySubject = {};
  for (const m of marks) {
    const code = m.subjectCode || 'unknown';
    if (!bySubject[code]) {
      bySubject[code] = { subjectCode: code, subjectName: m.subjectName, values: [] };
    }
    if (m.marksObtained != null) {
      bySubject[code].values.push(Number(m.marksObtained));
    }
  }

  const subjectWise = Object.values(bySubject).map((s) => {
    const vals = s.values.filter((n) => !Number.isNaN(n));
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = vals.length > 0 ? Math.round((sum / vals.length) * 100) / 100 : null;
    const min = vals.length > 0 ? Math.min(...vals) : null;
    const max = vals.length > 0 ? Math.max(...vals) : null;
    return {
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      count: vals.length,
      average: avg,
      min,
      max,
    };
  });

  res.json({
    examScheduleId,
    examName: schedule.examId?.name,
    className: schedule.classId?.name,
    totalStudents,
    passed,
    failed,
    passPercentage,
    subjectWise,
  });
});
