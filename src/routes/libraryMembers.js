import express from 'express';
import { LibraryMember } from '../models/LibraryMember.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const libraryMembersRouter = express.Router();

// GET /api/library-members?academicYearId=
libraryMembersRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const items = await LibraryMember.find({ academicYearId })
    .populate('studentId', 'firstName lastName admissionNumber')
    .populate('staffId', 'fullName')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    items: items.map((i) => ({
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      memberType: i.memberType,
      studentId: i.studentId ? String(i.studentId._id || i.studentId) : null,
      staffId: i.staffId ? String(i.staffId._id || i.staffId) : null,
      studentName: i.studentId?.firstName && i.studentId?.lastName
        ? `${i.studentId.firstName} ${i.studentId.lastName}`.trim()
        : null,
      staffName: i.staffId?.fullName || null,
      displayName: i.memberType === 'student'
        ? (i.studentId?.firstName && i.studentId?.lastName ? `${i.studentId.firstName} ${i.studentId.lastName}`.trim() : 'Student')
        : (i.staffId?.fullName || 'Staff'),
    })),
  });
});

// POST /api/library-members
libraryMembersRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const { memberType, studentId, staffId } = req.body || {};
  if (!memberType || !['student', 'staff'].includes(memberType)) {
    return res.status(400).json({ message: 'memberType must be student or staff' });
  }
  if (memberType === 'student' && !studentId) {
    return res.status(400).json({ message: 'studentId required for student member' });
  }
  if (memberType === 'staff' && !staffId) {
    return res.status(400).json({ message: 'staffId required for staff member' });
  }

  const existing = await LibraryMember.findOne({
    academicYearId,
    memberType,
    ...(memberType === 'student' ? { studentId } : { staffId }),
  });
  if (existing) {
    return res.status(400).json({ message: 'Member already exists' });
  }

  const doc = await LibraryMember.create({
    academicYearId,
    memberType,
    studentId: memberType === 'student' ? studentId : null,
    staffId: memberType === 'staff' ? staffId : null,
  });
  res.status(201).json(doc.toObject());
});

// DELETE /api/library-members/:id
libraryMembersRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await LibraryMember.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  await LibraryMember.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
