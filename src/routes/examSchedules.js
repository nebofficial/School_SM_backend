import express from 'express';
import { ExamSchedule } from '../models/ExamSchedule.js';
import { AcademicClass } from '../models/AcademicClass.js';
import { AcademicYear } from '../models/AcademicYear.js';

export const examSchedulesRouter = express.Router();

examSchedulesRouter.get('/', async (req, res) => {
  const academicYearId = (req.query.academicYearId || '').toString();
  if (!academicYearId) {
    return res.status(400).json({ message: 'academicYearId is required' });
  }

  const currentYear = await AcademicYear.findOne({
    _id: academicYearId,
    status: 'current',
  }).lean();
  if (!currentYear) {
    return res
      .status(400)
      .json({ message: 'academicYearId must be the current academic year' });
  }

  const classIds = await AcademicClass.find({ academicYearId }).distinct('_id');
  const query = { classId: { $in: classIds } };

  const items = await ExamSchedule.find(query)
    .populate('examId', 'name')
    .populate('classId', 'name')
    .populate('examGradeId', 'name')
    .populate('examAssessmentId', 'name')
    .populate('observationParameterId', 'name')
    .populate('competencyParameterId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ items });
});

examSchedulesRouter.get('/:id', async (req, res) => {
  const doc = await ExamSchedule.findById(req.params.id)
    .populate('examId', 'name')
    .populate('classId', 'name')
    .populate('examGradeId', 'name')
    .populate('examAssessmentId', 'name')
    .populate('observationParameterId', 'name')
    .populate('competencyParameterId', 'name')
    .lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

function mapAdditionalSubjects(arr) {
  return (Array.isArray(arr) ? arr : []).map((s, i) => ({
    name: String(s.name || '').trim(),
    code: String(s.code || '').trim(),
    date: s.date ? new Date(s.date) : null,
    startTime: String(s.startTime || '').trim(),
    duration: Number(s.duration) || 0,
    order: i,
  }));
}

examSchedulesRouter.post('/', async (req, res) => {
  const body = req.body || {};
  const academicYearId = (body.academicYearId || '').toString();
  if (!academicYearId) {
    return res.status(400).json({ message: 'academicYearId is required' });
  }

  const currentYear = await AcademicYear.findOne({
    _id: academicYearId,
    status: 'current',
  }).lean();
  if (!currentYear) {
    return res
      .status(400)
      .json({ message: 'academicYearId must be the current academic year' });
  }

  if (!body.examId || !body.classId) {
    return res
      .status(400)
      .json({ message: 'examId and classId are required' });
  }

  const cls = await AcademicClass.findOne({
    _id: body.classId,
    academicYearId,
  }).lean();
  if (!cls) {
    return res.status(400).json({
      message: 'classId must belong to the current academic year',
    });
  }

  const doc = await ExamSchedule.create({
    examId: body.examId,
    classId: body.classId,
    isReassessment: Boolean(body.isReassessment),
    examGradeId: body.examGradeId || null,
    examAssessmentId: body.examAssessmentId || null,
    observationParameterId: body.observationParameterId || null,
    competencyParameterId: body.competencyParameterId || null,
    lastExamDate: body.lastExamDate ? new Date(body.lastExamDate) : null,
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    description: String(body.description || '').trim(),
    additionalSubjects: mapAdditionalSubjects(body.additionalSubjects),
  });
  res.status(201).json(doc.toObject());
});

examSchedulesRouter.put('/:id', async (req, res) => {
  const body = req.body || {};
  const academicYearId = (body.academicYearId || '').toString();
  if (!academicYearId) {
    return res.status(400).json({ message: 'academicYearId is required' });
  }

  const currentYear = await AcademicYear.findOne({
    _id: academicYearId,
    status: 'current',
  }).lean();
  if (!currentYear) {
    return res
      .status(400)
      .json({ message: 'academicYearId must be the current academic year' });
  }

  const update = {};
  if (body.examId != null) update.examId = body.examId;
  if (body.classId != null) update.classId = body.classId;
  if (body.isReassessment != null)
    update.isReassessment = Boolean(body.isReassessment);
  if (body.examGradeId != null) update.examGradeId = body.examGradeId || null;
  if (body.examAssessmentId != null)
    update.examAssessmentId = body.examAssessmentId || null;
  if (body.observationParameterId != null)
    update.observationParameterId = body.observationParameterId || null;
  if (body.competencyParameterId != null)
    update.competencyParameterId = body.competencyParameterId || null;
  if (body.lastExamDate != null)
    update.lastExamDate = body.lastExamDate
      ? new Date(body.lastExamDate)
      : null;
  if (body.startDate != null)
    update.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate != null)
    update.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.description != null)
    update.description = String(body.description).trim();
  if (Array.isArray(body.additionalSubjects))
    update.additionalSubjects = mapAdditionalSubjects(body.additionalSubjects);

  if (update.classId) {
    const cls = await AcademicClass.findOne({
      _id: update.classId,
      academicYearId,
    }).lean();
    if (!cls) {
      return res.status(400).json({
        message: 'classId must belong to the current academic year',
      });
    }
  }

  const doc = await ExamSchedule.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  )
    .populate('examId', 'name')
    .populate('classId', 'name')
    .populate('examGradeId', 'name')
    .populate('examAssessmentId', 'name')
    .lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

examSchedulesRouter.delete('/:id', async (req, res) => {
  const doc = await ExamSchedule.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
