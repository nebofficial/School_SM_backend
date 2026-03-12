import express from 'express';
import { ClassTiming } from '../models/ClassTiming.js';

export const classTimingsRouter = express.Router();

function computeDurationAndSessionInfo(doc) {
  if (!doc.sessions || doc.sessions.length === 0) {
    return { durationHours: 0, durationMinutes: 0, sessionCount: 0, breakCount: 0, startTime: '', endTime: '' };
  }
  let sessionCount = 0;
  let breakCount = 0;
  let totalMinutes = 0;
  let firstTime = null;
  let lastTime = null;

  for (const s of doc.sessions) {
    if (s.isBreak) breakCount++;
    else sessionCount++;
    const [sh, sm] = (s.startTime || '0:0').split(':').map(Number);
    const [eh, em] = (s.endTime || '0:0').split(':').map(Number);
    totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
    if (!firstTime || s.startTime < firstTime) firstTime = s.startTime;
    if (!lastTime || s.endTime > lastTime) lastTime = s.endTime;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return {
    durationHours: hours,
    durationMinutes: mins,
    sessionCount,
    breakCount,
    startTime: firstTime || '',
    endTime: lastTime || '',
  };
}

classTimingsRouter.get('/', async (_req, res) => {
  const items = await ClassTiming.find()
    .sort({ createdAt: -1 })
    .lean();
  const enriched = items.map((item) => {
    const info = computeDurationAndSessionInfo(item);
    return {
      ...item,
      durationHours: info.durationHours,
      durationMinutes: info.durationMinutes,
      sessionCount: info.sessionCount,
      breakCount: info.breakCount,
      startTime: info.startTime,
      endTime: info.endTime,
    };
  });
  res.json({ items: enriched });
});

classTimingsRouter.get('/:id', async (req, res) => {
  const doc = await ClassTiming.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const info = computeDurationAndSessionInfo(doc);
  res.json({ ...doc, ...info });
});

classTimingsRouter.post('/', async (req, res) => {
  const { name, description, sessions } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name is required' });
  const sessionsArray = Array.isArray(sessions)
    ? sessions.map((s) => ({
        name: String(s.name || '').trim(),
        code: String(s.code || '').trim(),
        isBreak: Boolean(s.isBreak),
        startTime: String(s.startTime || '08:00').trim(),
        endTime: String(s.endTime || '08:45').trim(),
      }))
    : [];
  const doc = await ClassTiming.create({
    name: String(name).trim(),
    description: String(description || '').trim(),
    sessions: sessionsArray,
  });
  const info = computeDurationAndSessionInfo(doc);
  res.status(201).json({ ...doc.toObject(), ...info });
});

classTimingsRouter.put('/:id', async (req, res) => {
  const { name, description, sessions } = req.body || {};
  const update = {};
  if (name != null) update.name = String(name).trim();
  if (description != null) update.description = String(description || '').trim();
  if (sessions != null) {
    update.sessions = Array.isArray(sessions)
      ? sessions.map((s) => ({
          name: String(s.name || '').trim(),
          code: String(s.code || '').trim(),
          isBreak: Boolean(s.isBreak),
          startTime: String(s.startTime || '08:00').trim(),
          endTime: String(s.endTime || '08:45').trim(),
        }))
      : [];
  }
  const doc = await ClassTiming.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const info = computeDurationAndSessionInfo(doc);
  res.json({ ...doc, ...info });
});

classTimingsRouter.delete('/:id', async (req, res) => {
  const doc = await ClassTiming.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
