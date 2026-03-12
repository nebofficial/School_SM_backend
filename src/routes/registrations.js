import express from 'express';
import { Registration } from '../models/Registration.js';
import { AcademicClass } from '../models/AcademicClass.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';
import { hashPassword, isBcryptHash } from '../utils/auth.js';

export const registrationsRouter = express.Router();

registrationsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const classIds = await AcademicClass.find({ academicYearId }).distinct('_id');
  const requestedClassId = (req.query.classId || '').toString();
  const requestedSectionId = (req.query.sectionId || '').toString();
  let query;
  if (requestedClassId) {
    const cls = await AcademicClass.findOne({
      _id: requestedClassId,
      academicYearId,
    }).lean();
    if (!cls) {
      return res.status(400).json({
        message: 'classId must belong to the current academic year',
      });
    }
    query = { classId: requestedClassId };
    if (requestedSectionId) {
      query.sectionId = requestedSectionId;
    }
  } else {
    query = classIds.length ? { classId: { $in: classIds } } : { classId: null };
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  const total = await Registration.countDocuments(query);
  const items = await Registration.find(query)
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  res.json({ items, total, page, limit });
});

registrationsRouter.get('/:id', async (req, res) => {
  const doc = await Registration.findById(req.params.id)
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

registrationsRouter.post('/', async (req, res) => {
  const body = req.body || {};
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  if (body.classId) {
    const cls = await AcademicClass.findOne({
      _id: body.classId,
      academicYearId,
    }).lean();
    if (!cls) {
      return res.status(400).json({
        message: 'classId must belong to the current academic year',
      });
    }
  }

  const password =
    body.password && !isBcryptHash(String(body.password))
      ? await hashPassword(body.password)
      : String(body.password || '').trim();

  const doc = await Registration.create({
    regNumber: String(body.regNumber || '').trim(),
    appNo: String(body.appNo || '').trim(),
    period: String(body.period || '').trim(),
    admissionNumber: String(body.admissionNumber || '').trim(),
    admissionDate: body.admissionDate ? new Date(body.admissionDate) : null,
    classId: body.classId || null,
    sectionId: body.sectionId || null,
    firstName: String(body.firstName || '').trim(),
    lastName: String(body.lastName || '').trim(),
    gender: String(body.gender || '').trim(),
    bloodGroup: String(body.bloodGroup || '').trim(),
    religion: String(body.religion || '').trim(),
    caste: String(body.caste || '').trim(),
    birthDate: body.birthDate ? new Date(body.birthDate) : null,
    contactNumber: String(body.contactNumber || '').trim(),
    email: String(body.email || '').trim(),
    nationalId: String(body.nationalId || '').trim(),
    studentType: String(body.studentType || '').trim(),
    group: String(body.group || '').trim(),
    rollNo: String(body.rollNo || '').trim(),
    discount: String(body.discount || '').trim(),
    secondLanguage: String(body.secondLanguage || '').trim(),
    fatherName: String(body.fatherName || '').trim(),
    fatherPhone: String(body.fatherPhone || '').trim(),
    fatherEducation: String(body.fatherEducation || '').trim(),
    fatherProfession: String(body.fatherProfession || '').trim(),
    fatherDesignation: String(body.fatherDesignation || '').trim(),
    fatherPhotoUrl: String(body.fatherPhotoUrl || '').trim(),
    motherName: String(body.motherName || '').trim(),
    motherPhone: String(body.motherPhone || '').trim(),
    motherEducation: String(body.motherEducation || '').trim(),
    motherProfession: String(body.motherProfession || '').trim(),
    motherDesignation: String(body.motherDesignation || '').trim(),
    motherPhotoUrl: String(body.motherPhotoUrl || '').trim(),
    isGuardian: String(body.isGuardian || '').trim(),
    relationWithGuardian: String(body.relationWithGuardian || '').trim(),
    sameAsGuardianAddress: Boolean(body.sameAsGuardianAddress),
    presentAddress: String(body.presentAddress || '').trim(),
    permanentAddress: String(body.permanentAddress || '').trim(),
    previousInstitute: String(body.previousInstitute || '').trim(),
    previousClass: String(body.previousClass || '').trim(),
    transferCertificateUrl: String(body.transferCertificateUrl || '').trim(),
    username: String(body.username || '').trim(),
    password,
    healthCondition: String(body.healthCondition || '').trim(),
    otherInfo: String(body.otherInfo || '').trim(),
    photoUrl: String(body.photoUrl || '').trim(),
    guardianName: String(body.guardianName || '').trim(),
    guardianContact: String(body.guardianContact || '').trim(),
    relation: String(body.relation || '').trim(),
    enrollmentType: String(body.enrollmentType || 'Regular').trim(),
    status: String(body.status || 'active').trim(),
    paymentStatus: String(body.paymentStatus || 'Unpaid').trim(),
    dateOfRegistration: body.dateOfRegistration ? new Date(body.dateOfRegistration) : null,
  });
  res.status(201).json(doc.toObject());
});

registrationsRouter.put('/:id', async (req, res) => {
  const body = req.body || {};
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const update = {};
  const fields = [
    'regNumber', 'appNo', 'period', 'admissionNumber', 'admissionDate', 'classId', 'sectionId',
    'firstName', 'lastName', 'gender', 'bloodGroup', 'religion', 'caste', 'birthDate',
    'contactNumber', 'email', 'nationalId', 'studentType', 'group', 'rollNo', 'discount', 'secondLanguage',
    'fatherName', 'fatherPhone', 'fatherEducation', 'fatherProfession', 'fatherDesignation', 'fatherPhotoUrl',
    'motherName', 'motherPhone', 'motherEducation', 'motherProfession', 'motherDesignation', 'motherPhotoUrl',
    'isGuardian', 'relationWithGuardian', 'sameAsGuardianAddress', 'presentAddress', 'permanentAddress',
    'previousInstitute', 'previousClass', 'transferCertificateUrl', 'username', 'password',
    'healthCondition', 'otherInfo', 'photoUrl', 'guardianName', 'guardianContact', 'relation',
    'enrollmentType', 'status', 'paymentStatus', 'dateOfRegistration'
  ];
  const dateFields = ['birthDate', 'dateOfRegistration', 'admissionDate'];
  const refFields = ['classId', 'sectionId'];
  for (const f of fields) {
    if (body[f] !== undefined) {
      if (dateFields.includes(f)) update[f] = body[f] ? new Date(body[f]) : null;
      else if (refFields.includes(f)) update[f] = body[f] || null;
      else if (f === 'sameAsGuardianAddress') update[f] = Boolean(body[f]);
      else if (f === 'password') {
        update[f] = isBcryptHash(String(body[f])) ? String(body[f]) : await hashPassword(body[f]);
      }
      else update[f] = String(body[f] || '').trim();
    }
  }

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

  const doc = await Registration.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

registrationsRouter.delete('/:id', async (req, res) => {
  const doc = await Registration.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
