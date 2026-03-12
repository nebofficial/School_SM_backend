import { AcademicYear } from '../models/AcademicYear.js';

/**
 * Ensures that the incoming request refers to an AcademicYear document
 * whose status is "current".
 *
 * It looks for academicYearId first in the query string, then in the body.
 * If the id is missing or does not point to a current year, this helper
 * sends an appropriate error response and returns null.
 *
 * Usage inside an Express route:
 *   const academicYearId = await ensureCurrentAcademicYear(req, res);
 *   if (!academicYearId) return;
 *
 *   // safe to use academicYearId here
 */
export async function ensureCurrentAcademicYear(req, res) {
  const academicYearId = (
    (req.query && req.query.academicYearId) ||
    (req.body && req.body.academicYearId) ||
    ''
  ).toString();

  if (!academicYearId) {
    res.status(400).json({ message: 'academicYearId is required' });
    return null;
  }

  const current = await AcademicYear.findOne({
    _id: academicYearId,
    status: 'current',
  }).lean();

  if (!current) {
    res
      .status(400)
      .json({ message: 'academicYearId must be the current academic year' });
    return null;
  }

  return academicYearId;
}

