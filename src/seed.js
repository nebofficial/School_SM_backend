/**
 * Full Data Seed  — covers ALL collections with 20 demo records each.
 * Usage:
 *   node src/seed.js            ← skip if data exists
 *   node src/seed.js --fresh    ← wipe & re-seed everything
 */
import 'dotenv/config';
import mongoose from 'mongoose';

// ─── models ──────────────────────────────────────────────────────────────────
import { AcademicYear } from './models/AcademicYear.js';
import { AcademicClass } from './models/AcademicClass.js';
import { AcademicSection } from './models/AcademicSection.js';
import { AcademicSubject } from './models/AcademicSubject.js';
import { AcademicCalendar } from './models/AcademicCalendar.js';
import { Registration } from './models/Registration.js';
import { Staff } from './models/Staff.js';
import { StaffAttendance } from './models/StaffAttendance.js';
import { StudentAttendance } from './models/StudentAttendance.js';
import { Leave } from './models/Leave.js';
import { Payroll } from './models/Payroll.js';
import { LibraryMember } from './models/LibraryMember.js';
import { Book } from './models/Book.js';
import { BookIssue } from './models/BookIssue.js';
import { EBook } from './models/EBook.js';
import { ExamTerm } from './models/ExamTerm.js';
import { Exam } from './models/Exam.js';
import { ExamGrade } from './models/ExamGrade.js';
import { ExamAssessment } from './models/ExamAssessment.js';
import { ExamSchedule } from './models/ExamSchedule.js';
import { ExamMark } from './models/ExamMark.js';
import { ExamResult } from './models/ExamResult.js';
import { ObservationParameter } from './models/ObservationParameter.js';
import { ObservationMark } from './models/ObservationMark.js';
import { CompetencyParameter } from './models/CompetencyParameter.js';
import { CompetencyMark } from './models/CompetencyMark.js';
import { Room } from './models/Room.js';
import { ClassTiming } from './models/ClassTiming.js';
import { Hostel } from './models/Hostel.js';
import { HostelRoom } from './models/HostelRoom.js';
import { RoomAllocation } from './models/RoomAllocation.js';
import { HostelAttendance } from './models/HostelAttendance.js';
import { HostelFeeInvoice } from './models/HostelFeeInvoice.js';
import { MessMenu } from './models/MessMenu.js';
import { Vehicle } from './models/Vehicle.js';
import { Driver } from './models/Driver.js';
import { Route } from './models/Route.js';
import { TransportAllocation } from './models/TransportAllocation.js';
import { TransportFeeInvoice } from './models/TransportFeeInvoice.js';
import { Warehouse } from './models/Warehouse.js';
import { InventoryCategory } from './models/InventoryCategory.js';
import { Supplier } from './models/Supplier.js';
import { Vendor } from './models/Vendor.js';
import { Product } from './models/Product.js';
import { StockLedger } from './models/StockLedger.js';
import { Purchase } from './models/Purchase.js';
import { Sale } from './models/Sale.js';
import { Issue } from './models/Issue.js';
import { AssetStore } from './models/AssetStore.js';
import { Asset } from './models/Asset.js';
import { AssetIssue } from './models/AssetIssue.js';
import { Maintenance } from './models/Maintenance.js';
import { ComplaintType } from './models/ComplaintType.js';
import { Complaint } from './models/Complaint.js';
import { CertificateType } from './models/CertificateType.js';
import { EnrollmentType } from './models/EnrollmentType.js';
import { Event } from './models/Event.js';
import { Message } from './models/Message.js';

// ─── helpers ─────────────────────────────────────────────────────────────────
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad = (n, p = 3) => String(n).padStart(p, '0');

const MALE_NAMES = ['Ram', 'Shyam', 'Hari', 'Mohan', 'Gopal', 'Bikash', 'Sanjay', 'Rohan', 'Suresh', 'Dinesh', 'Ganesh', 'Naresh', 'Kiran', 'Bijay', 'Ashok', 'Prakash', 'Manoj', 'Deepak', 'Rajesh', 'Santosh'];
const FEMALE_NAMES = ['Sita', 'Gita', 'Maya', 'Laxmi', 'Sunita', 'Anita', 'Rekha', 'Sabita', 'Puja', 'Kamala', 'Mina', 'Nisha', 'Sangita', 'Binita', 'Kabita', 'Sarita', 'Kopila', 'Anju', 'Bimala', 'Samjhana'];
const LAST_NAMES = ['Sharma', 'Thapa', 'Poudel', 'Adhikari', 'Karki', 'Bhandari', 'Rai', 'Gurung', 'Tamang', 'Shrestha', 'Basnet', 'Magar', 'Limbu', 'Lama', 'KC', 'Koirala', 'Bhattarai', 'Acharya', 'Pandey', 'Nepal'];
const ADDRESSES = ['Kathmandu-1', 'Bhaktapur-2', 'Lalitpur-3', 'Pokhara-4', 'Biratnagar-5', 'Butwal-6', 'Birgunj-7', 'Dharan-8', 'Nepalgunj-9', 'Hetauda-10', 'Chitwan-11', 'Janakpur-12', 'Palpa-13', 'Ilam-14', 'Dang-15', 'Surkhet-16', 'Jumla-17', 'Dadeldhura-18', 'Mahendranagar-19', 'Taplejung-20'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const RELIGIONS = ['Hindu', 'Buddhist', 'Christian', 'Muslim'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Nepali', 'Social Studies', 'Computer', 'Arts', 'Commerce', 'Health', 'Optional Math', 'Physics', 'Chemistry', 'Biology', 'Account', 'Economics'];
const DEPT_NAMES = ['Mathematics', 'Science', 'English', 'Nepali', 'Social Studies', 'Computer', 'Arts', 'Commerce', 'Sports', 'Music'];

const firstName = (i) => i % 2 === 0 ? MALE_NAMES[i % 20] : FEMALE_NAMES[i % 20];
const gender = (i) => i % 2 === 0 ? 'Male' : 'Female';
const lastName = (i) => LAST_NAMES[i % 20];
const phone = (base, i) => `98${String(base + i).slice(0, 8)}`;
const email = (name, suf, i) => `${name.toLowerCase()}${suf}${i}@school.edu.np`;

// ─── seed helper ─────────────────────────────────────────────────────────────
async function seedCollection(Model, name, buildFn, count = 20) {
    const existing = await Model.countDocuments();
    if (existing > 0) {
        console.log(`  ⬛ ${name}: ${existing} already exist — skipped`);
        return await Model.find().lean();
    }
    const docs = [];
    for (let i = 0; i < count; i++) docs.push(buildFn(i));
    const inserted = await Model.insertMany(docs, { ordered: false }).catch(e => {
        console.warn(`  ⚠️  ${name}: partial insert — ${e.message.slice(0, 80)}`);
        return Model.find().lean();
    });
    console.log(`  ✅ ${name}: inserted ${inserted.length}`);
    return inserted;
}

// ─── main ────────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('❌ MONGODB_URI missing'); process.exit(1); }

async function main() {
    const fresh = process.argv.includes('--fresh');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    if (fresh) {
        const cols = await mongoose.connection.db.listCollections().toArray();
        for (const c of cols) await mongoose.connection.db.dropCollection(c.name).catch(() => { });
        console.log('🗑️  All collections dropped (--fresh)\n');
    }

    // ── 1. Academic Year ───────────────────────────────────────────────────────
    console.log('📅 Academic infra...');
    let [ay] = await seedCollection(AcademicYear, 'AcademicYear', (i) => ({
        name: `${2081 + i}-${2082 + i}`,
        startDate: new Date(`${2024 + i}-04-14`),
        endDate: new Date(`${2025 + i}-04-13`),
        status: i === 0 ? 'current' : 'draft',
    }));
    if (!ay) { ay = await AcademicYear.findOne({ status: 'current' }) || await AcademicYear.findOne(); }
    const ayId = ay._id;

    // ── 2. Classes ─────────────────────────────────────────────────────────────
    const classNames = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 Science', 'Class 11 Mgmt', 'Class 12 Science', 'Class 12 Mgmt', 'Nursery', 'LKG', 'UKG', 'Class Prep', 'Bridge Course', 'Special Class'];
    const classes = await seedCollection(AcademicClass, 'AcademicClass', (i) => ({
        name: classNames[i], code: `CL-${pad(i + 1)}`, academicYearId: ayId,
    }));

    // ── 3. Sections ────────────────────────────────────────────────────────────
    const secNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    const sections = await seedCollection(AcademicSection, 'AcademicSection', (i) => ({
        name: secNames[i], academicYearId: ayId, classId: classes[i % classes.length]._id,
    }));

    // ── 4. Subjects ────────────────────────────────────────────────────────────
    const subjectNames = [...SUBJECTS];
    while (subjectNames.length < 20) subjectNames.push(`Elective ${subjectNames.length - 14}`);
    await seedCollection(AcademicSubject, 'AcademicSubject', (i) => ({
        name: subjectNames[i], alias: subjectNames[i].slice(0, 4).toUpperCase(),
        code: `SUB-${pad(i + 1)}`, shortCode: subjectNames[i].slice(0, 3).toUpperCase(),
        type: rnd(['Theory', 'Practical', 'Both']), academicYearId: ayId,
    }));

    // ── 5. Academic Calendar ───────────────────────────────────────────────────
    const calTitles = ['Dashain Holiday', 'Tihar Holiday', 'Holi Holiday', 'Final Exam', 'Half Yearly Exam', 'Sports Day', 'Science Fair', 'Annual Day', 'Parent Meeting', 'Teacher Training', 'National Day', 'Democracy Day', 'Republic Day', 'Constitution Day', 'Eid Holiday', 'Christmas Holiday', 'New Year', 'Buddha Jayanti', 'Shivaratri', 'Teej'];
    const calTypes = ['holiday', 'exam', 'event', 'meeting', 'other'];
    await seedCollection(AcademicCalendar, 'AcademicCalendar', (i) => ({
        title: calTitles[i], description: `${calTitles[i]} celebration`,
        eventDate: new Date(2024, i % 12, (i % 28) + 1),
        eventType: calTypes[i % 5], academicYearId: ayId,
    }));

    // ── 6. Students (Registration) ────────────────────────────────────────────
    console.log('\n🎓 Students & Staff...');
    const students = await seedCollection(Registration, 'Registration (Students)', (i) => {
        const fn = firstName(i); const ln = lastName(i);
        return {
            regNumber: `REG-2081-${pad(i + 1)}`, appNo: `APP-${pad(i + 1, 4)}`, period: '2081',
            admissionNumber: `ADM-2081-${pad(i + 1)}`, admissionDate: new Date('2024-04-01'),
            classId: classes[i % classes.length]._id, sectionId: sections[i % sections.length]._id,
            firstName: fn, lastName: ln, gender: gender(i),
            bloodGroup: BLOOD_GROUPS[i % 8], religion: RELIGIONS[i % 4], caste: ln,
            birthDate: new Date(`${2010 - (i % 5)}-${pad((i % 12) + 1, 2)}-${pad((i % 28) + 1, 2)}`),
            contactNumber: phone(10000000, i * 100), email: email(fn, ln, i),
            nationalId: `NID-STU-${2000000 + i}`, studentType: 'Day Scholar', rollNo: String(i + 1),
            fatherName: `${MALE_NAMES[i % 20]} ${ln}`, fatherPhone: phone(20000000, i * 100),
            fatherProfession: rnd(['Farmer', 'Business', 'Government Job', 'Private Job']),
            motherName: `${FEMALE_NAMES[i % 20]} ${ln}`, motherPhone: phone(30000000, i * 100),
            presentAddress: ADDRESSES[i % 20], permanentAddress: ADDRESSES[i % 20],
            username: `${fn.toLowerCase()}${i + 1}`, password: 'student@123',
            enrollmentType: 'Regular', status: 'active',
            paymentStatus: i % 3 === 0 ? 'Paid' : 'Unpaid',
            dateOfRegistration: new Date('2024-04-01'),
        };
    });

    // ── 7. Staff (Teachers) ───────────────────────────────────────────────────
    const qualifications = ['B.Ed', 'M.Ed', 'B.Sc', 'M.Sc', 'M.A', 'B.A'];
    const staff = await seedCollection(Staff, 'Staff (Teachers)', (i) => {
        const fn = i % 2 === 0 ? MALE_NAMES[i % 20] : FEMALE_NAMES[i % 20];
        const ln = LAST_NAMES[i % 20];

        // First staff: dedicated school admin account
        if (i === 0) {
            return {
                fullName: 'System Admin',
                code: 'ADMIN-001',
                nationalId: 'NID-ADMIN-0001',
                email: 'admin@school.edu.np',
                phone: phone(40000000, 0),
                gender: 'Male',
                bloodGroup: BLOOD_GROUPS[0],
                religion: RELIGIONS[0],
                birthDate: new Date('1985-01-01'),
                presentAddress: ADDRESSES[0],
                permanentAddress: ADDRESSES[0],
                role: 'admin',
                department: 'Administration',
                qualification: 'M.Ed',
                experienceYears: 10,
                joinDate: new Date('2020-04-01'),
                username: 'admin',
                password: 'password',
                salaryGrade: 'Grade-1',
                salaryType: 'Monthly',
                isViewOnWeb: false,
                status: 'active',
                academicYearId: ayId,
            };
        }

        // Other staff: regular teachers
        return {
            fullName: `${fn} ${ln}`, code: `TCH-${pad(i + 1)}`,
            nationalId: `NID-TCH-${3000000 + i}`, email: email(fn, ln, 100 + i),
            phone: phone(40000000, i * 100), gender: gender(i),
            bloodGroup: BLOOD_GROUPS[i % 8], religion: RELIGIONS[i % 4],
            birthDate: new Date(`${1980 + (i % 20)}-${pad((i % 12) + 1, 2)}-15`),
            presentAddress: ADDRESSES[i % 20], permanentAddress: ADDRESSES[i % 20],
            role: 'teacher', department: DEPT_NAMES[i % 10],
            qualification: rnd(qualifications), experienceYears: (i % 15) + 1,
            joinDate: new Date(`${2020 - (i % 10)}-04-01`),
            username: `teacher${fn.toLowerCase()}${i + 1}`, password: 'teacher@123',
            salaryGrade: `Grade-${(i % 5) + 1}`, salaryType: rnd(['Monthly', 'Yearly']),
            isViewOnWeb: true, status: 'active', academicYearId: ayId,
        };
    });

    // ── 8. Staff Attendance ───────────────────────────────────────────────────
    console.log('\n📋 Attendance...');
    const attStatuses = ['present', 'absent', 'late', 'half-day', 'leave'];
    await seedCollection(StaffAttendance, 'StaffAttendance', (i) => ({
        staffId: staff[i % staff.length]._id, academicYearId: ayId,
        date: new Date(2024, 11, i + 1), status: attStatuses[i % 5], method: 'manual',
        checkIn: new Date(`2024-12-${pad(i + 1, 2)}T09:00:00`),
        checkOut: new Date(`2024-12-${pad(i + 1, 2)}T17:00:00`),
    }));

    // ── 9. Student Attendance ─────────────────────────────────────────────────
    await seedCollection(StudentAttendance, 'StudentAttendance', (i) => ({
        registrationId: students[i % students.length]._id,
        classId: classes[i % classes.length]._id, academicYearId: ayId,
        date: new Date(2024, 11, i + 1), status: attStatuses[i % 5], method: 'manual',
        checkIn: new Date(`2024-12-${pad(i + 1, 2)}T10:00:00`),
    }));

    // ── 10. Leave ─────────────────────────────────────────────────────────────
    const leaveTypes = ['sick', 'casual', 'annual', 'emergency', 'other'];
    await seedCollection(Leave, 'Leave', (i) => ({
        applicantType: 'staff', staffId: staff[i % staff.length]._id, academicYearId: ayId,
        leaveType: leaveTypes[i % 5],
        startDate: new Date(2024, 11, i + 1), endDate: new Date(2024, 11, i + 2), days: 1,
        reason: `${leaveTypes[i % 5]} leave application`, status: rnd(['pending', 'approved', 'rejected']),
    }));

    // ── 11. Payroll ───────────────────────────────────────────────────────────
    console.log('\n💰 Finance...');
    await seedCollection(Payroll, 'Payroll', (i) => {
        const base = 20000 + (i % 10) * 2000;
        return {
            staffId: staff[i % staff.length]._id, academicYearId: ayId,
            month: (i % 12) + 1, year: 2024, baseSalary: base,
            allowances: 3000, deductions: 500, bonus: 1000, netSalary: base + 3500,
            status: rnd(['draft', 'approved', 'paid']),
        };
    });

    // ── 12. Library ───────────────────────────────────────────────────────────
    console.log('\n📚 Library...');
    const bookTitles = ['Mathematics Grade 10', 'English Grammar', 'Nepali Sahitya', 'Science Lab Manual', 'History of Nepal', 'Computer Fundamentals', 'Physics Textbook', 'Chemistry Lab', 'Biology Concepts', 'Social Studies', 'Accountancy', 'Economics Intro', 'Optional Mathematics', 'Health Education', 'Environment Science', 'Arts & Craft', 'Music Fundamentals', 'Sports Science', 'Moral Education', 'Career Guidance'];
    const bookAuthors = ['RB Sthapit', 'DB Manandhar', 'PK Bhattarai', 'NK Shrestha', 'SB Rana', 'MB Thapa', 'JB Karki', 'KB Poudel', 'TB Gurung', 'PB Rai', 'AB Sharma', 'GB Adhikari', 'HB Bhandari', 'IB Tamang', 'LB Magar', 'MB Limbu', 'NB Lama', 'OB KC', 'QB Koirala', 'RB Acharya'];
    const books = await seedCollection(Book, 'Book', (i) => ({
        academicYearId: ayId, title: bookTitles[i], bookId: `BK-${pad(i + 1)}`,
        isbnNo: `978-9937-${pad(i + 1, 4)}-0`, edition: `${(i % 5) + 1}th`,
        author: bookAuthors[i], language: i % 5 === 0 ? 'Nepali' : 'English',
        price: 200 + i * 25, quantity: 10 + i, almiraNo: `A-${i + 1}`,
    }));

    const libMembers = await seedCollection(LibraryMember, 'LibraryMember', (i) => ({
        academicYearId: ayId,
        memberType: i < 10 ? 'student' : 'staff',
        studentId: i < 10 ? students[i]._id : undefined,
        staffId: i >= 10 ? staff[i - 10]._id : undefined,
    }));

    await seedCollection(BookIssue, 'BookIssue', (i) => ({
        academicYearId: ayId, bookId: books[i % books.length]._id,
        memberId: libMembers[i % libMembers.length]._id,
        issuedAt: new Date(2024, 9, i + 1), returnDate: new Date(2024, 9, i + 15),
        status: i % 3 === 0 ? 'returned' : 'issued', fineAmount: i % 3 === 0 ? 10 : 0,
    }));

    await seedCollection(EBook, 'EBook', (i) => ({
        academicYearId: ayId, classId: classes[i % classes.length]._id,
        name: `E-${bookTitles[i]}`, edition: '1st', author: bookAuthors[i],
        language: 'English', documentUrl: `https://school.edu.np/ebooks/book${i + 1}.pdf`,
    }));

    // ── 13. Exams ─────────────────────────────────────────────────────────────
    console.log('\n📝 Exams...');
    const examTerms = await seedCollection(ExamTerm, 'ExamTerm', (i) => ({
        name: `Term ${i + 1}`, division: i < 10 ? 'First Half' : 'Second Half',
        displayName: `Term ${i + 1} - ${2024 + Math.floor(i / 10)}`,
    }));

    const examGrades = await seedCollection(ExamGrade, 'ExamGrade', (i) => ({
        name: `Grade System ${i + 1}`, description: `Grading scale ${i + 1}`,
        grades: [
            { code: 'A+', minScore: 90, maxScore: 100, value: 4.0, label: 'Outstanding', color: '#16a34a' },
            { code: 'A', minScore: 80, maxScore: 89, value: 3.6, label: 'Excellent', color: '#22c55e' },
            { code: 'B+', minScore: 70, maxScore: 79, value: 3.2, label: 'Very Good', color: '#84cc16' },
            { code: 'B', minScore: 60, maxScore: 69, value: 2.8, label: 'Good', color: '#eab308' },
            { code: 'C', minScore: 45, maxScore: 59, value: 2.4, label: 'Average', color: '#f97316' },
            { code: 'D', minScore: 35, maxScore: 44, value: 1.6, label: 'Below Avg', color: '#ef4444', failGrade: true },
            { code: 'E', minScore: 0, maxScore: 34, value: 0, label: 'Fail', color: '#dc2626', failGrade: true },
        ],
    }));

    const examAssessments = await seedCollection(ExamAssessment, 'ExamAssessment', (i) => ({
        name: `Assessment ${i + 1}`, description: `Assessment format ${i + 1}`,
        records: [
            { name: 'Written', code: 'WR', maxMark: 80, passingMark: 32, order: 1 },
            { name: 'Practical', code: 'PR', maxMark: 20, passingMark: 8, order: 2 },
        ],
    }));

    const obsParams = await seedCollection(ObservationParameter, 'ObservationParameter', (i) => ({
        name: `Observation Param ${i + 1}`, examGradeId: examGrades[i % examGrades.length]._id,
        description: `Behavioral observation parameter ${i + 1}`,
        records: [{ name: 'Discipline', code: 'DIS', maxMark: 10, passingMark: 4, order: 1 }],
    }));

    const compParams = await seedCollection(CompetencyParameter, 'CompetencyParameter', (i) => ({
        name: `Competency Param ${i + 1}`, examGradeId: examGrades[i % examGrades.length]._id,
        description: `Competency parameter ${i + 1}`,
        domains: [{ domain: 'Cognitive', code: 'COG', order: 1, indicators: [{ name: 'Memory', code: 'MEM', order: 1 }] }],
    }));

    const examNames = ['First Terminal', 'Half Yearly', 'Second Terminal', 'Annual Exam', 'Pre-Board', 'Board Exam', 'Unit Test 1', 'Unit Test 2', 'Unit Test 3', 'Unit Test 4', 'Monthly Test 1', 'Monthly Test 2', 'Monthly Test 3', 'Monthly Test 4', 'Internal Exam 1', 'Internal Exam 2', 'Assessment 1', 'Assessment 2', 'Practical Exam', 'Viva Exam'];
    const exams = await seedCollection(Exam, 'Exam', (i) => ({
        name: examNames[i], code: `EX-${pad(i + 1)}`, examTermId: examTerms[i % examTerms.length]._id,
        assessmentFormat: rnd(['Mark Based', 'Grade Based']), weightage: 100, division: i < 10 ? 'First' : 'Second',
    }));

    const examSchedules = await seedCollection(ExamSchedule, 'ExamSchedule', (i) => ({
        examId: exams[i % exams.length]._id, classId: classes[i % classes.length]._id,
        examGradeId: examGrades[i % examGrades.length]._id,
        examAssessmentId: examAssessments[i % examAssessments.length]._id,
        startDate: new Date(2024, 11, 1), endDate: new Date(2024, 11, 20),
    }));

    await seedCollection(ExamMark, 'ExamMark', (i) => ({
        academicYearId: ayId, examScheduleId: examSchedules[i % examSchedules.length]._id,
        registrationId: students[i % students.length]._id,
        subjectCode: `SUB-${pad((i % 15) + 1)}`, subjectName: SUBJECTS[(i % 15)],
        maxMarks: 100, marksObtained: 40 + (i % 60), gradeCode: rnd(['A+', 'A', 'B+', 'B', 'C']),
    }));

    await seedCollection(ExamResult, 'ExamResult', (i) => ({
        academicYearId: ayId, examScheduleId: examSchedules[i % examSchedules.length]._id,
        registrationId: students[i % students.length]._id,
        totalMarks: 350 + i * 5, maxTotalMarks: 500,
        percentage: 70 + (i % 25), gradeCode: rnd(['A', 'B+', 'B', 'C']), isPass: true,
    }));

    await seedCollection(ObservationMark, 'ObservationMark', (i) => ({
        academicYearId: ayId, examScheduleId: examSchedules[i % examSchedules.length]._id,
        registrationId: students[i % students.length]._id, marksObtained: 7 + (i % 4),
    }));

    await seedCollection(CompetencyMark, 'CompetencyMark', (i) => ({
        academicYearId: ayId, examScheduleId: examSchedules[i % examSchedules.length]._id,
        registrationId: students[i % students.length]._id, marksObtained: 8 + (i % 3),
    }));

    // ── 14. Timetable infra ───────────────────────────────────────────────────
    console.log('\n🕐 Timetable & Rooms...');
    await seedCollection(Room, 'Room', (i) => ({
        name: `${i + 101}`, code: `RM-${pad(i + 1)}`, block: `Block ${String.fromCharCode(65 + (i % 4))}`, floor: `Floor ${(i % 4) + 1}`,
    }));

    await seedCollection(ClassTiming, 'ClassTiming', (i) => ({
        name: `Timing Set ${i + 1}`, description: `Period plan ${i + 1}`,
        sessions: [
            { name: 'Period 1', code: 'P1', startTime: '07:00', endTime: '07:45' },
            { name: 'Break', code: 'BR', isBreak: true, startTime: '07:45', endTime: '08:00' },
            { name: 'Period 2', code: 'P2', startTime: '08:00', endTime: '08:45' },
        ],
    }));

    // ── 15. Hostel ────────────────────────────────────────────────────────────
    console.log('\n🏠 Hostel...');
    const hostelTypes = ['boys', 'girls', 'staff'];
    const hostels = await seedCollection(Hostel, 'Hostel', (i) => ({
        academicYearId: ayId, name: `${['Boys', 'Girls', 'Staff'][i % 3]} Hostel ${Math.floor(i / 3) + 1}`,
        hostelType: hostelTypes[i % 3], address: ADDRESSES[i % 20],
        note: `Hostel ${i + 1} facility`,
    }));

    const roomTypes = ['single', 'double', 'triple', 'dormitory'];
    const hostelRooms = await seedCollection(HostelRoom, 'HostelRoom', (i) => ({
        academicYearId: ayId, hostelId: hostels[i % hostels.length]._id,
        roomNo: `${i + 101}`, roomType: roomTypes[i % 4],
        seatTotal: [1, 2, 3, 10][i % 4], costPerSeat: 2000 + i * 100,
    }));

    const allocs = await seedCollection(RoomAllocation, 'RoomAllocation', (i) => ({
        academicYearId: ayId, roomId: hostelRooms[i % hostelRooms.length]._id,
        seatNumber: (i % 3) + 1, studentId: students[i % students.length]._id,
        status: 'active',
    }));

    await seedCollection(HostelAttendance, 'HostelAttendance', (i) => ({
        academicYearId: ayId, date: new Date(2024, 11, i + 1),
        allocationId: allocs[i % allocs.length]._id,
        status: rnd(['present', 'leave', 'absent', 'outpass']),
    }));

    const months = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'];
    await seedCollection(HostelFeeInvoice, 'HostelFeeInvoice', (i) => ({
        academicYearId: ayId, allocationId: allocs[i % allocs.length]._id,
        month: months[i], roomCharge: 2000 + i * 50, messCharge: 3000,
        paidAmount: i % 2 === 0 ? 5000 : 0, dueDate: new Date(2024, 9 + (i % 12), 15),
    }));

    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    await seedCollection(MessMenu, 'MessMenu', (i) => ({
        academicYearId: ayId, dayOfWeek: Math.floor(i / 3) % 7, mealType: mealTypes[i % 3],
        description: `${['Dal Bhat', 'Roti Tarkari', 'Chowmein', 'Rice Curry', 'Bread Egg'][i % 5]} with salad`,
    }));

    // ── 16. Transport ─────────────────────────────────────────────────────────
    console.log('\n🚌 Transport...');
    const drivers = await seedCollection(Driver, 'Driver', (i) => ({
        academicYearId: ayId, name: `${MALE_NAMES[i % 20]} ${LAST_NAMES[i % 20]}`,
        license: `DL-${pad(100000 + i, 6)}`, phone: phone(50000000, i * 100),
    }));

    const vehicleModels = ['bus', 'van', 'mini-bus'];
    const vehicles = await seedCollection(Vehicle, 'Vehicle', (i) => ({
        academicYearId: ayId, vehicleNumber: `BA ${pad(1 + i, 2)} PA ${pad(1000 + i, 4)}`,
        vehicleModel: vehicleModels[i % 3], driverId: drivers[i % drivers.length]._id,
        vehicleLicense: `VL-${pad(i + 1)}`, vehicleContact: phone(60000000, i * 100),
    }));

    const routeNames = ['Kathmandu-Bhaktapur', 'Kathmandu-Lalitpur', 'Bhaktapur-Kirtipur', 'Patan-Thankot', 'Baneshwor-Kalanki', 'Koteshwor-Kalanki', 'Suryabinayak-Satdobato', 'Thimi-Chabahil', 'Bansbari-Balaju', 'Tinkune-Nayabazar', 'Gongabu-Swoyambhu', 'Ratnapark-Kirtipur', 'Kupondol-Lagankhel', 'Jawalakhel-Satdobato', 'Mahalaxmisthan-Ekantakuna', 'Minbhawan-Bijulibazar', 'NewRoad-Balkhu', 'Bagbazar-Maharajgunj', 'Bouddha-Jorpati', 'Chabahil-Naxal'];
    const routes = await seedCollection(Route, 'Route', (i) => ({
        academicYearId: ayId, routeName: routeNames[i],
        routeStart: routeNames[i].split('-')[0], routeEnd: routeNames[i].split('-')[1] || routeNames[i],
        vehicleId: vehicles[i % vehicles.length]._id,
        stops: [
            { stopName: `Stop A-${i + 1}`, stopKm: 1, stopFare: 50 },
            { stopName: `Stop B-${i + 1}`, stopKm: 3, stopFare: 100 },
        ],
    }));

    const transAllocs = await seedCollection(TransportAllocation, 'TransportAllocation', (i) => ({
        academicYearId: ayId, studentId: students[i % students.length]._id,
        routeId: routes[i % routes.length]._id,
        stopName: `Stop A-${(i % 20) + 1}`, stopKm: 1.5, stopFare: 500 + i * 10,
        status: 'active',
    }));

    await seedCollection(TransportFeeInvoice, 'TransportFeeInvoice', (i) => ({
        academicYearId: ayId, allocationId: transAllocs[i % transAllocs.length]._id,
        month: months[i], fare: 500 + i * 10, paidAmount: i % 2 === 0 ? 500 : 0,
        dueDate: new Date(2024, 9 + (i % 12), 10),
    }));

    // ── 17. Inventory ─────────────────────────────────────────────────────────
    console.log('\n📦 Inventory...');
    const warehouses = await seedCollection(Warehouse, 'Warehouse', (i) => ({
        academicYearId: ayId, name: `Warehouse ${i + 1}`, note: `Storage unit ${i + 1}`,
    }));

    const invCats = await seedCollection(InventoryCategory, 'InventoryCategory', (i) => ({
        academicYearId: ayId, name: `Category ${i + 1}`, type: i < 10 ? 'inventory' : 'asset',
    }));

    const suppliers = await seedCollection(Supplier, 'Supplier', (i) => ({
        academicYearId: ayId, supplier: `Supplier ${i + 1} Pvt Ltd`,
        contactName: `${MALE_NAMES[i % 20]} ${LAST_NAMES[i % 20]}`,
        email: `supplier${i + 1}@example.com`, phone: phone(70000000, i * 100),
        address: ADDRESSES[i % 20],
    }));

    const productNames = ['Chalk Box', 'Marker Set', 'A4 Paper Ream', 'Stapler', 'Scissors', 'Glue Stick', 'White Board', 'Duster', 'Pen Set', 'Notebook Bundle', 'Geometry Box', 'Color Pencil', 'Eraser Pack', 'Scale Box', 'Sharpener', 'Ink Bottle', 'Correction Fluid', 'Tape Roll', 'File Folder', 'Binder Clip'];
    const products = await seedCollection(Product, 'Product', (i) => ({
        academicYearId: ayId, categoryId: invCats[i % Math.min(invCats.length, 10)]._id,
        name: productNames[i], productCode: `PRD-${pad(i + 1)}`,
        warehouseId: warehouses[i % warehouses.length]._id,
    }));

    await seedCollection(StockLedger, 'StockLedger', (i) => ({
        academicYearId: ayId, productId: products[i % products.length]._id,
        warehouseId: warehouses[i % warehouses.length]._id,
        openingQty: 50 + i, currentQty: 50 + i,
    }));

    await seedCollection(Purchase, 'Purchase', (i) => ({
        academicYearId: ayId, supplierId: suppliers[i % suppliers.length]._id,
        productId: products[i % products.length]._id,
        warehouseId: warehouses[i % warehouses.length]._id,
        quantity: 10 + i, unitPrice: 50 + i * 5, total: (10 + i) * (50 + i * 5),
        date: new Date(2024, 8 + (i % 4), i + 1),
    }));

    const vendors = await seedCollection(Vendor, 'Vendor', (i) => ({
        academicYearId: ayId, name: `Vendor ${i + 1} Traders`,
        contactName: `${FEMALE_NAMES[i % 20]} ${LAST_NAMES[i % 20]}`,
        email: `vendor${i + 1}@example.com`, phone: phone(80000000, i * 100),
        address: ADDRESSES[i % 20],
    }));

    await seedCollection(Sale, 'Sale', (i) => ({
        academicYearId: ayId, productId: products[i % products.length]._id,
        quantity: 2 + (i % 5), unitPrice: 60 + i * 3, total: (2 + (i % 5)) * (60 + i * 3),
        paidAmount: i % 2 === 0 ? (2 + (i % 5)) * (60 + i * 3) : 0,
        paymentStatus: i % 2 === 0 ? 'paid' : 'due',
        customerName: `${MALE_NAMES[i % 20]} ${LAST_NAMES[i % 20]}`,
        date: new Date(2024, 9 + (i % 3), i + 1),
    }));

    await seedCollection(Issue, 'Issue', (i) => ({
        academicYearId: ayId, productId: products[i % products.length]._id,
        quantity: 1 + (i % 3), issuedTo: `${DEPT_NAMES[i % 10]} Dept`,
        date: new Date(2024, 10, i + 1),
    }));

    // ── 18. Assets ────────────────────────────────────────────────────────────
    console.log('\n🏫 Assets...');
    const assetStores = await seedCollection(AssetStore, 'AssetStore', (i) => ({
        academicYearId: ayId, name: `Asset Store ${i + 1}`, note: `Store room ${i + 1}`,
    }));

    const assetNames = ['Projector', 'Computer', 'Printer', 'Scanner', 'CCTV Camera', 'Server', 'UPS', 'Whiteboard', 'Chair', 'Table', 'Cupboard', 'Almirah', 'Generator', 'Air Conditioner', 'Electric Fan', 'Water Cooler', 'Fire Extinguisher', 'First Aid Box', 'Microscope', 'Telescope'];
    const assetCats = invCats.filter((_, idx) => idx >= 10);
    const assets = await seedCollection(Asset, 'Asset', (i) => ({
        academicYearId: ayId,
        categoryId: (assetCats.length > 0 ? assetCats : invCats)[i % (assetCats.length || invCats.length)]._id,
        name: assetNames[i], productCode: `AST-${pad(i + 1)}`,
        type: i % 2 === 0 ? 'non-consumable' : 'consumable',
        storeId: assetStores[i % assetStores.length]._id, quantity: 5 + i,
    }));

    await seedCollection(AssetIssue, 'AssetIssue', (i) => ({
        academicYearId: ayId, assetId: assets[i % assets.length]._id,
        issuedTo: `${DEPT_NAMES[i % 10]} Department`, issueDate: new Date(2024, 9, i + 1),
        returnDate: i % 2 === 0 ? new Date(2024, 10, i + 1) : null,
        status: i % 2 === 0 ? 'returned' : 'issued',
    }));

    await seedCollection(Maintenance, 'Maintenance', (i) => ({
        academicYearId: ayId, assetId: assets[i % assets.length]._id,
        date: new Date(2024, 10, i + 1), description: `Routine maintenance of ${assetNames[i % 20]}`,
        cost: 500 + i * 100,
    }));

    // ── 19. Complaints ────────────────────────────────────────────────────────
    console.log('\n📣 Misc...');
    const complaintTypeNames = ['Bullying', 'Infrastructure', 'Teacher Conduct', 'Cleanliness', 'Food Quality', 'Safety', 'Transport', 'Library', 'Medical', 'IT Issues', 'Fees', 'Exam', 'Attendance', 'Uniform', 'Homework', 'Sports', 'Cultural', 'Administrative', 'Canteen', 'Other'];
    const cmpTypes = await seedCollection(ComplaintType, 'ComplaintType', (i) => ({
        academicYearId: ayId, name: complaintTypeNames[i], note: `${complaintTypeNames[i]} related complaints`,
    }));

    await seedCollection(Complaint, 'Complaint', (i) => ({
        academicYearId: ayId, userType: i % 2 === 0 ? 'student' : 'parent',
        complainBy: `${MALE_NAMES[i % 20]} ${LAST_NAMES[i % 20]}`,
        complainTypeId: cmpTypes[i % cmpTypes.length]._id,
        complainDate: new Date(2024, 10, i + 1),
        complain: `Complaint regarding ${complaintTypeNames[i % 20].toLowerCase()} issue.`,
    }));

    // ── 20. Certificate & Enrollment Types ────────────────────────────────────
    const certTypes = ['Character Certificate', 'Transfer Certificate', 'Scholarship Certificate', 'Participation Certificate', 'Achievement Certificate', 'Sports Certificate', 'Cultural Certificate', 'Academic Excellence', 'Merit Certificate', 'Grade Certificate', 'Completion Certificate', 'Migration Certificate', 'Provisional Certificate', 'Bonafide Certificate', 'NOC Certificate', 'Experience Letter', 'Internship Certificate', 'Research Certificate', 'Leadership Certificate', 'Innovation Certificate'];
    await seedCollection(CertificateType, 'CertificateType', (i) => ({
        academicYearId: ayId, name: certTypes[i],
        schoolName: 'Demo School Pvt. Ltd.', certificateText: `This is to certify that the student has been awarded the ${certTypes[i]}.`,
    }));

    const enrollTypes = ['Regular', 'Transfer', 'Re-Admission', 'Distance Learning', 'Online', 'Exchange', 'Scholarship', 'Sponsored', 'Government', 'Private', 'Public', 'Semi-Private', 'International', 'Local', 'Rural', 'Urban', 'Special Needs', 'Gifted', 'Normal', 'Provisional'];
    await seedCollection(EnrollmentType, 'EnrollmentType', (i) => ({
        academicYearId: ayId, name: enrollTypes[i],
    }));

    // ── 21. Events ────────────────────────────────────────────────────────────
    const eventTitles = ['Annual Sports Day', 'Science Exhibition', 'Cultural Program', 'Parent-Teacher Meeting', 'School Anniversary', 'Tree Plantation', 'Blood Donation Camp', 'Career Fair', 'Math Olympiad', 'Debate Competition', 'Art Exhibition', 'Music Concert', 'Drama Festival', 'Computer Workshop', 'Environment Day', 'Health Camp', 'Yoga Day', 'Independence Day', 'Constitution Day', 'Republic Day'];
    await seedCollection(Event, 'Event', (i) => ({
        title: eventTitles[i], eventFor: rnd(['All', 'Students', 'Teachers', 'Parents']),
        eventPlace: ADDRESSES[i % 20],
        fromDate: new Date(2024, i % 12, (i % 28) + 1),
        toDate: new Date(2024, i % 12, (i % 28) + 2),
        note: `${eventTitles[i]} details`, isViewOnWeb: true,
    }));

    // ── 22. Messages ──────────────────────────────────────────────────────────
    const subjects = ['Fee Reminder', 'Exam Notice', 'Attendance Alert', 'Holiday Notice', 'Meeting Notice', 'Result Published', 'Event Invite', 'Assignment Due', 'Test Schedule', 'General Notice', 'Emergency Alert', 'Library Notice', 'Transport Update', 'Hostel Notice', 'Scholarship Info', 'Complaint Response', 'Leave Approval', 'Payroll Notice', 'Document Request', 'Important Update'];
    await seedCollection(Message, 'Message', (i) => ({
        senderId: `admin-001`, senderName: 'School Admin',
        recipientId: `user-${pad(i + 1)}`,
        recipientName: `${MALE_NAMES[i % 20]} ${LAST_NAMES[i % 20]}`,
        subject: subjects[i], body: `Dear student/staff, ${subjects[i]} - please take necessary action.`,
        isDraft: i % 5 === 0,
    }));

    await mongoose.disconnect();
    console.log('\n🎉 All collections seeded successfully!');
}

main().catch(err => { console.error('❌ Seed failed:', err); mongoose.disconnect(); process.exit(1); });
