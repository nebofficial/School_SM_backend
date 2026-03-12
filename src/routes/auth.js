import express from 'express';
import { Staff } from '../models/Staff.js';
import { Registration } from '../models/Registration.js';
import { hashPassword, signAccessToken, verifyPassword } from '../utils/auth.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

authRouter.post('/login', async (req, res) => {
  const body = req.body || {};
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const userType = String(body.userType || 'staff').trim(); // 'staff' | 'student'

  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  if (userType === 'student') {
    const student = await Registration.findOne({ username }).lean();
    if (!student) return res.status(401).json({ message: 'Invalid credentials' });

    const result = await verifyPassword({ candidatePassword: password, storedPassword: student.password });
    if (!result.ok) return res.status(401).json({ message: 'Invalid credentials' });

    if (result.needsRehash) {
      await Registration.updateOne({ _id: student._id }, { $set: { password: await hashPassword(password) } });
    }

    const token = signAccessToken({
      type: 'student',
      sub: String(student._id),
      username: student.username,
    });

    return res.json({
      token,
      user: {
        type: 'student',
        id: String(student._id),
        username: student.username,
        firstName: student.firstName,
        lastName: student.lastName,
        classId: student.classId,
        sectionId: student.sectionId,
        status: student.status,
      },
    });
  }

  const staff = await Staff.findOne({ username }).lean();
  if (!staff) return res.status(401).json({ message: 'Invalid credentials' });
  if (staff.status && staff.status !== 'active') {
    return res.status(403).json({ message: 'Account is not active' });
  }

  const result = await verifyPassword({ candidatePassword: password, storedPassword: staff.password });
  if (!result.ok) return res.status(401).json({ message: 'Invalid credentials' });

  if (result.needsRehash) {
    await Staff.updateOne({ _id: staff._id }, { $set: { password: await hashPassword(password) } });
  }

  const token = signAccessToken({
    type: 'staff',
    sub: String(staff._id),
    username: staff.username,
    role: staff.role,
    academicYearId: String(staff.academicYearId),
  });

  return res.json({
    token,
    user: {
      type: 'staff',
      id: String(staff._id),
      username: staff.username,
      fullName: staff.fullName,
      role: staff.role,
      academicYearId: staff.academicYearId,
      status: staff.status,
    },
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

