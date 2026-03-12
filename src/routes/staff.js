import express from 'express';
import { Staff } from '../models/Staff.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';
import { hashPassword, isBcryptHash } from '../utils/auth.js';
import { requireAuth, requireRole, requireStaff } from '../middleware/auth.js';

export const staffRouter = express.Router();

// All staff endpoints require an authenticated staff user.
staffRouter.use(requireAuth, requireStaff);

// GET /api/staff?academicYearId=&q=&role=&status=
staffRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const q = (req.query.q || '').toString().trim();
  const role = (req.query.role || '').toString().trim();
  const status = (req.query.status || '').toString().trim();

  const query = { academicYearId };
  if (q) {
    query.fullName = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }
  if (role) query.role = role;
  if (status) query.status = status;

  const items = await Staff.find(query).sort({ fullName: 1 }).lean();
  res.json({ items });
});

// POST /api/staff
staffRouter.post('/', requireRole('admin'), async (req, res) => {
  const body = req.body || {};
  if (!body.fullName) {
    return res.status(400).json({ message: 'fullName is required' });
  }

  // Ensure the staff member is always created in the current academic year
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const password =
    body.password && !isBcryptHash(String(body.password))
      ? await hashPassword(body.password)
      : body.password;

  const doc = await Staff.create({
    fullName: body.fullName,
    code: body.code,
    nationalId: body.nationalId,
    email: body.email,
    phone: body.phone,
    gender: body.gender,
    bloodGroup: body.bloodGroup,
    religion: body.religion,
    birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
    presentAddress: body.presentAddress,
    permanentAddress: body.permanentAddress,
    role: body.role || 'teacher',
    department: body.department,
    qualification: body.qualification,
    experienceYears: body.experienceYears ?? 0,
    joinDate: body.joinDate ? new Date(body.joinDate) : undefined,
    username: body.username,
    password,
    salaryGrade: body.salaryGrade,
    salaryType: body.salaryType,
    resumeUrl: body.resumeUrl,
    isViewOnWeb: body.isViewOnWeb ?? true,
    facebookUrl: body.facebookUrl,
    linkedinUrl: body.linkedinUrl,
    twitterUrl: body.twitterUrl,
    instagramUrl: body.instagramUrl,
    youtubeUrl: body.youtubeUrl,
    pinterestUrl: body.pinterestUrl,
    otherInfo: body.otherInfo,
    photoUrl: body.photoUrl,
    status: body.status || 'active',
    academicYearId,
  });

  res.status(201).json(doc.toObject());
});

// PUT /api/staff/:id
staffRouter.put('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  // Ensure we're updating staff in the current academic year
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  // Verify the staff member belongs to the current academic year
  const existing = await Staff.findById(id).lean();
  if (!existing) {
    return res.status(404).json({ message: 'Not found' });
  }
  if (existing.academicYearId.toString() !== academicYearId) {
    return res.status(400).json({
      message: 'Staff member does not belong to the current academic year',
    });
  }

  const updateFields = {};
  const fieldMap = {
    fullName: (v) => v != null,
    code: (v) => v != null,
    nationalId: (v) => v != null,
    email: (v) => v != null,
    phone: (v) => v != null,
    gender: (v) => v != null,
    bloodGroup: (v) => v != null,
    religion: (v) => v != null,
    birthDate: (v) => v != null,
    presentAddress: (v) => v != null,
    permanentAddress: (v) => v != null,
    role: (v) => v != null,
    department: (v) => v != null,
    qualification: (v) => v != null,
    experienceYears: (v) => v != null,
    joinDate: (v) => v != null,
    username: (v) => v != null,
    password: (v) => v != null,
    salaryGrade: (v) => v != null,
    salaryType: (v) => v != null,
    resumeUrl: (v) => v != null,
    isViewOnWeb: (v) => v != null,
    facebookUrl: (v) => v != null,
    linkedinUrl: (v) => v != null,
    twitterUrl: (v) => v != null,
    instagramUrl: (v) => v != null,
    youtubeUrl: (v) => v != null,
    pinterestUrl: (v) => v != null,
    otherInfo: (v) => v != null,
    photoUrl: (v) => v != null,
    status: (v) => v != null,
  };
  for (const [key, check] of Object.entries(fieldMap)) {
    const val = body[key];
    if (check(val)) {
      if (key === 'birthDate' || key === 'joinDate') {
        updateFields[key] = new Date(val);
      } else if (key === 'password') {
        updateFields.password = isBcryptHash(String(val)) ? val : await hashPassword(val);
      } else {
        updateFields[key] = val;
      }
    }
  }

  const updated = await Staff.findByIdAndUpdate(
    id,
    updateFields,
    { new: true, runValidators: true },
  );

  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated.toObject());
});

// DELETE /api/staff/:id
staffRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  // Find the staff member
  const existing = await Staff.findById(id).lean();
  if (!existing) {
    return res.status(404).json({ message: 'Not found' });
  }

  // Verify the staff member belongs to the current academic year
  const currentYear = await AcademicYear.findOne({
    _id: existing.academicYearId,
    status: 'current',
  }).lean();

  if (!currentYear) {
    return res.status(400).json({
      message: 'Staff member does not belong to the current academic year',
    });
  }

  const updated = await Staff.findByIdAndUpdate(
    id,
    { status: 'resigned' },
    { new: true },
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});

