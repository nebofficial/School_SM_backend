import express from 'express';
import { Payroll } from '../models/Payroll.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const payrollRouter = express.Router();

// GET /api/payroll?academicYearId=&staffId=&month=&year=
payrollRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const staffId = (req.query.staffId || '').toString();
  const month = req.query.month ? parseInt(req.query.month) : null;
  const year = req.query.year ? parseInt(req.query.year) : null;

  const query = { academicYearId };
  if (staffId) query.staffId = staffId;
  if (month) query.month = month;
  if (year) query.year = year;

  const items = await Payroll.find(query)
    .populate('staffId', 'fullName')
    .sort({ year: -1, month: -1 })
    .lean();
  res.json({ items });
});

// POST /api/payroll
payrollRouter.post('/', async (req, res) => {
  const {
    staffId,
    academicYearId,
    month,
    year,
    baseSalary,
    allowances,
    deductions,
    bonus,
    netSalary,
    status,
    paymentDate,
    notes,
  } = req.body || {};
  if (
    !staffId ||
    !academicYearId ||
    month == null ||
    year == null ||
    baseSalary == null ||
    netSalary == null
  ) {
    return res.status(400).json({
      message:
        'staffId, academicYearId, month, year, baseSalary and netSalary are required',
    });
  }

  const doc = await Payroll.create({
    staffId,
    academicYearId,
    month,
    year,
    baseSalary,
    allowances: allowances ?? 0,
    deductions: deductions ?? 0,
    bonus: bonus ?? 0,
    netSalary,
    status: status || 'draft',
    paymentDate: paymentDate ? new Date(paymentDate) : undefined,
    notes,
  });
  res.status(201).json(doc.toObject());
});

// PUT /api/payroll/:id
payrollRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const updated = await Payroll.findByIdAndUpdate(
    id,
    {
      ...(body.baseSalary != null ? { baseSalary: body.baseSalary } : {}),
      ...(body.allowances != null ? { allowances: body.allowances } : {}),
      ...(body.deductions != null ? { deductions: body.deductions } : {}),
      ...(body.bonus != null ? { bonus: body.bonus } : {}),
      ...(body.netSalary != null ? { netSalary: body.netSalary } : {}),
      ...(body.status != null ? { status: body.status } : {}),
      ...(body.paymentDate != null
        ? { paymentDate: new Date(body.paymentDate) }
        : {}),
      ...(body.notes != null ? { notes: body.notes } : {}),
    },
    { new: true, runValidators: true },
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated.toObject());
});

// DELETE /api/payroll/:id
payrollRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await Payroll.findByIdAndDelete(id);
  res.status(204).send();
});
