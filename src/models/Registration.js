import mongoose from 'mongoose';

const RegistrationSchema = new mongoose.Schema(
  {
    regNumber: { type: String, trim: true, default: '' },
    appNo: { type: String, trim: true, default: '' },
    period: { type: String, trim: true, default: '' },
    admissionNumber: { type: String, trim: true, default: '' },
    admissionDate: { type: Date, default: null },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicClass',
      default: null,
    },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSection', default: null },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    gender: { type: String, trim: true, default: '' },
    bloodGroup: { type: String, trim: true, default: '' },
    religion: { type: String, trim: true, default: '' },
    caste: { type: String, trim: true, default: '' },
    birthDate: { type: Date, default: null },
    contactNumber: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    nationalId: { type: String, trim: true, default: '' },
    studentType: { type: String, trim: true, default: '' },
    group: { type: String, trim: true, default: '' },
    rollNo: { type: String, trim: true, default: '' },
    discount: { type: String, trim: true, default: '' },
    secondLanguage: { type: String, trim: true, default: '' },
    fatherName: { type: String, trim: true, default: '' },
    fatherPhone: { type: String, trim: true, default: '' },
    fatherEducation: { type: String, trim: true, default: '' },
    fatherProfession: { type: String, trim: true, default: '' },
    fatherDesignation: { type: String, trim: true, default: '' },
    fatherPhotoUrl: { type: String, trim: true, default: '' },
    motherName: { type: String, trim: true, default: '' },
    motherPhone: { type: String, trim: true, default: '' },
    motherEducation: { type: String, trim: true, default: '' },
    motherProfession: { type: String, trim: true, default: '' },
    motherDesignation: { type: String, trim: true, default: '' },
    motherPhotoUrl: { type: String, trim: true, default: '' },
    isGuardian: { type: String, trim: true, default: '' },
    relationWithGuardian: { type: String, trim: true, default: '' },
    sameAsGuardianAddress: { type: Boolean, default: false },
    presentAddress: { type: String, trim: true, default: '' },
    permanentAddress: { type: String, trim: true, default: '' },
    previousInstitute: { type: String, trim: true, default: '' },
    previousClass: { type: String, trim: true, default: '' },
    transferCertificateUrl: { type: String, trim: true, default: '' },
    username: { type: String, trim: true, default: '' },
    password: { type: String, trim: true, default: '' },
    healthCondition: { type: String, trim: true, default: '' },
    otherInfo: { type: String, trim: true, default: '' },
    photoUrl: { type: String, trim: true, default: '' },
    guardianName: { type: String, trim: true, default: '' },
    guardianContact: { type: String, trim: true, default: '' },
    relation: { type: String, trim: true, default: '' },
    enrollmentType: { type: String, trim: true, default: 'Regular' },
    status: { type: String, trim: true, default: 'active' },
    paymentStatus: { type: String, trim: true, default: 'Unpaid' },
    dateOfRegistration: { type: Date, default: null },
  },
  { timestamps: true }
);

RegistrationSchema.index({ regNumber: 1 });
RegistrationSchema.index({ period: 1 });
RegistrationSchema.index({ status: 1 });
RegistrationSchema.index({ classId: 1 });

export const Registration =
  mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);
