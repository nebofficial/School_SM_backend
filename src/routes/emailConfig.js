import express from 'express';
import { EmailConfig } from '../models/EmailConfig.js';

export const emailConfigRouter = express.Router();

emailConfigRouter.get('/', async (_req, res) => {
  let doc = await EmailConfig.findOne().lean();
  if (!doc) {
    await EmailConfig.create({});
    doc = await EmailConfig.findOne().lean();
  }
  res.json({
    emailProtocol: doc.emailProtocol || 'smtp',
    emailType: doc.emailType || 'html',
    charSet: doc.charSet || 'utf-8',
    priority: doc.priority || 'normal',
    fromName: doc.fromName || '',
    fromEmail: doc.fromEmail || '',
  });
});

emailConfigRouter.put('/', async (req, res) => {
  let doc = await EmailConfig.findOne();
  if (!doc) doc = await EmailConfig.create({});
  const b = req.body || {};
  if (b.emailProtocol != null) doc.emailProtocol = (b.emailProtocol || '').toString().trim();
  if (b.emailType != null) doc.emailType = (b.emailType || '').toString().trim();
  if (b.charSet != null) doc.charSet = (b.charSet || '').toString().trim();
  if (b.priority != null) doc.priority = (b.priority || '').toString().trim();
  if (b.fromName != null) doc.fromName = (b.fromName || '').toString().trim();
  if (b.fromEmail != null) doc.fromEmail = (b.fromEmail || '').toString().trim();
  await doc.save();
  res.json({
    emailProtocol: doc.emailProtocol,
    emailType: doc.emailType,
    charSet: doc.charSet,
    priority: doc.priority,
    fromName: doc.fromName,
    fromEmail: doc.fromEmail,
  });
});
