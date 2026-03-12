import express from 'express';
import { SubjectMarkConfig } from '../models/SubjectMarkConfig.js';
import { Exam } from '../models/Exam.js';
import { AcademicClass } from '../models/AcademicClass.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const subjectMarkConfigRouter = express.Router();

// GET /api/subject-mark-config/summary?academicYearId=
// Returns distinct (examId, classId) combinations for the given academic year
subjectMarkConfigRouter.get('/summary', async (req, res) => {
  try {
    const academicYearId =
      (req.query.academicYearId || '').toString() ||
      (await ensureCurrentAcademicYear(req, res));
    if (!academicYearId) return;

    const rows = await SubjectMarkConfig.find({ academicYearId })
      .select('examId classId')
      .lean();

    if (!rows.length) {
      return res.json({ items: [] });
    }

    const keySet = new Set();
    const combos = [];
    for (const row of rows) {
      const examId = row.examId?.toString();
      const classId = row.classId?.toString();
      if (!examId || !classId) continue;
      const key = `${examId}:${classId}`;
      if (keySet.has(key)) continue;
      keySet.add(key);
      combos.push({ examId, classId });
    }

    if (!combos.length) {
      return res.json({ items: [] });
    }

    const examIds = [...new Set(combos.map((c) => c.examId))];
    const classIds = [...new Set(combos.map((c) => c.classId))];

    const [exams, classes] = await Promise.all([
      Exam.find({ _id: { $in: examIds } }).select('name').lean(),
      AcademicClass.find({ _id: { $in: classIds } }).select('name code').lean(),
    ]);

    const examMap = new Map(exams.map((e) => [e._id.toString(), e]));
    const classMap = new Map(classes.map((c) => [c._id.toString(), c]));

    const items = combos.map((combo) => {
      const exam = examMap.get(combo.examId);
      const cls = classMap.get(combo.classId);
      return {
        examId: combo.examId,
        examName: exam?.name || '',
        classId: combo.classId,
        className: cls?.name || '',
        classCode: cls?.code || '',
      };
    });

    res.json({ items });
  } catch (err) {
    console.error('GET /subject-mark-config/summary failed', err);
    res
      .status(500)
      .json({
        message: 'Failed to load subject mark config list',
        error: err.message,
      });
  }
});

// GET /api/subject-mark-config?academicYearId=&examId=&classId=
subjectMarkConfigRouter.get('/', async (req, res) => {
  try {
    const academicYearId =
      (req.query.academicYearId || '').toString() ||
      (await ensureCurrentAcademicYear(req, res));
    if (!academicYearId) return;

    const examId = (req.query.examId || '').toString();
    const classId = (req.query.classId || '').toString();
    if (!examId || !classId) {
      return res
        .status(400)
        .json({ message: 'examId and classId are required' });
    }

    const items = await SubjectMarkConfig.find({
      academicYearId,
      examId,
      classId,
    })
      .sort({ isMain: -1, name: 1 })
      .lean();

    res.json({ items });
  } catch (err) {
    console.error('GET /subject-mark-config failed', err);
    res
      .status(500)
      .json({ message: 'Failed to load subject mark config', error: err.message });
  }
});

// PUT /api/subject-mark-config
// Body: { academicYearId?, examId, classId, items: [ { isMain, subjectId?, name, code, fullMark, ... } ] }
subjectMarkConfigRouter.put('/', async (req, res) => {
  try {
    const body = req.body || {};
    const academicYearId =
      (body.academicYearId || '').toString() ||
      (await ensureCurrentAcademicYear(req, res));
    if (!academicYearId) return;

    const examId = (body.examId || '').toString();
    const classId = (body.classId || '').toString();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!examId || !classId) {
      return res
        .status(400)
        .json({ message: 'examId and classId are required' });
    }

    // Simple replace-all strategy for this triplet
    await SubjectMarkConfig.deleteMany({ academicYearId, examId, classId });

    if (items.length === 0) {
      return res.json({ items: [] });
    }

    const docs = items.map((row) => ({
      academicYearId,
      examId,
      classId,
      isMain: !!row.isMain,
      subjectId: row.subjectId || null,
      name: String(row.name || '').trim(),
      code: String(row.code || '').trim(),
      date: row.date ? new Date(row.date) : null,
      fullMark: Number(row.fullMark || 0),
      passMark: Number(row.passMark || 0),
      subjectCrHr: Number(row.subjectCrHr || 0),
      practicalCrHr: Number(row.practicalCrHr || 0),
      theory: Number(row.theory || 0),
      speaking: Number(row.speaking || 0),
      practical: Number(row.practical || 0),
      oral: Number(row.oral || 0),
      project: Number(row.project || 0),
      presentation: Number(row.presentation || 0),
    }));

    const created = await SubjectMarkConfig.insertMany(docs);
    res.json({ items: created.map((d) => d.toObject()) });
  } catch (err) {
    console.error('PUT /subject-mark-config failed', err);
    res
      .status(500)
      .json({ message: 'Failed to save subject mark config', error: err.message });
  }
});

