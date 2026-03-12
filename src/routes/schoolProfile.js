import express from 'express';
import { SchoolProfile } from '../models/SchoolProfile.js';

export const schoolProfileRouter = express.Router();

// Singleton: only one school profile document in collection

// GET /api/school-profile
schoolProfileRouter.get('/', async (_req, res) => {
  let doc = await SchoolProfile.findOne().lean();
  if (!doc) {
    doc = await SchoolProfile.create({});
    doc = doc.toObject();
  }
  res.json(doc);
});

// PUT /api/school-profile
schoolProfileRouter.put('/', async (req, res) => {
  const body = req.body || {};

  const update = {};
  const fields = [
    'schoolUrl', 'schoolCode', 'systemName', 'schoolName', 'startingYear',
    'schoolAddress', 'officialPhone', 'registrationDate', 'email', 'fax', 'footerText',
    'country', 'city',
    'systemLogoUrl', 'otherLogoUrl',
    'currency', 'currencySymbol', 'enableFrontend', 'basedOnFinalResult',
    'language', 'theme', 'onlineAdmission', 'enableRtl',
    'zoomApiKey', 'zoomSecret', 'googleMapUrl',
    'facebookUrl', 'twitterUrl', 'linkedinUrl', 'youtubeUrl', 'instagramUrl', 'pinterestUrl',
    'dateFormat', 'emailProtocol', 'emailType', 'emailCharSet', 'emailPriority',
    'emailFromName', 'emailFromEmail',
    'openingHours',
    'systemColorCode',
    'enableReturnOption', 'bookReturnPeriod',
    'enableRecurringInvoices', 'recurringReminderBeforeDay',
    'feesPaymentReminder', 'feesReminderBeforeDay',
    'paypalEmail', 'enableSandbox',
    'admissionFees', 'registrationFees',
    'virtualClassroomEnabled',
    'parentCanMessageClass', 'studentsCanMessageEachOther',
    'studentApprovalEnabled',
    'howToVideosDisplay',
    'principalSignatureUrl', 'mailNotificationEnabled',
    'footerDescription',
    'headerEnabled',
    'pushNotificationEnabled',
  ];

  for (const key of fields) {
    if (body[key] === undefined) continue;
    if (key === 'registrationDate') {
      update[key] = body[key] ? new Date(body[key]) : null;
    } else if (typeof body[key] === 'boolean') {
      update[key] = body[key];
    } else if (typeof body[key] === 'number') {
      update[key] = body[key];
    } else if (body[key] != null) {
      update[key] = String(body[key]).trim();
    }
  }

  const doc = await SchoolProfile.findOneAndUpdate(
    {},
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  res.json(doc);
});
