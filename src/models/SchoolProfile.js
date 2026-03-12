import mongoose from 'mongoose';

const SchoolProfileSchema = new mongoose.Schema(
  {
    // 1. Basic Information
    schoolUrl: { type: String, trim: true, default: '' }, // no space, no capital, no special char
    schoolCode: { type: String, trim: true, default: '' },
    systemName: { type: String, trim: true, default: 'School Management System' },
    schoolName: { type: String, trim: true, default: '' },
    startingYear: { type: String, trim: true, default: '2025' },
    schoolAddress: { type: String, trim: true, default: '' },
    officialPhone: { type: String, trim: true, default: '' },
    registrationDate: { type: Date, default: null },
    email: { type: String, trim: true, default: 'admin@gmail.com' },
    fax: { type: String, trim: true, default: '' },
    footerText: { type: String, trim: true, default: '' },

    // 2. Location Settings
    country: { type: String, trim: true, default: 'United States' },
    city: { type: String, trim: true, default: 'Los Angeles' },

    // 3. Logo & Branding
    systemLogoUrl: { type: String, trim: true, default: '' },
    otherLogoUrl: { type: String, trim: true, default: '' },

    // 4. Setting Information
    currency: { type: String, trim: true, default: 'USD' },
    currencySymbol: { type: String, trim: true, default: '$' },
    enableFrontend: { type: Boolean, default: true },
    basedOnFinalResult: { type: String, trim: true, default: 'Average of All Exam' },
    language: { type: String, trim: true, default: 'English' },
    theme: { type: String, trim: true, default: 'SlateGray' },
    onlineAdmission: { type: Boolean, default: true },
    enableRtl: { type: Boolean, default: false },
    zoomApiKey: { type: String, trim: true, default: '' },
    zoomSecret: { type: String, trim: true, default: '' },
    googleMapUrl: { type: String, trim: true, default: '' },

    // 5. Social Links
    facebookUrl: { type: String, trim: true, default: '' },
    twitterUrl: { type: String, trim: true, default: '' },
    linkedinUrl: { type: String, trim: true, default: '' },
    youtubeUrl: { type: String, trim: true, default: '' },
    instagramUrl: { type: String, trim: true, default: '' },
    pinterestUrl: { type: String, trim: true, default: '' },

    // 6. Email Setting
    dateFormat: { type: String, trim: true, default: 'yy/mm/dd' },
    emailProtocol: { type: String, trim: true, default: 'mail' },
    emailType: { type: String, trim: true, default: 'html' },
    emailCharSet: { type: String, trim: true, default: 'iso-8859-1' },
    emailPriority: { type: String, trim: true, default: 'highest' },
    emailFromName: { type: String, trim: true, default: '' },
    emailFromEmail: { type: String, trim: true, default: '' },

    // 7. Opening Hours (JSON string: { "monday": { "start": "10:00", "end": "12:00" }, ... })
    openingHours: { type: String, trim: true, default: '' },

    // 8. System Appearance (legacy)
    systemColorCode: { type: String, trim: true, default: '#5840bb' },

    // 6. Book Return Settings
    enableReturnOption: { type: Boolean, default: true },
    bookReturnPeriod: { type: Number, default: 7 },

    // 7. Recurring Invoices Settings
    enableRecurringInvoices: { type: Boolean, default: true },
    recurringReminderBeforeDay: { type: Number, default: 3 },

    // 8. Fees Payment Reminder Settings
    feesPaymentReminder: { type: Boolean, default: true },
    feesReminderBeforeDay: { type: Number, default: 3 },

    // 9. Payment Settings
    paypalEmail: { type: String, trim: true, default: '' },
    enableSandbox: { type: Boolean, default: true },

    // 10. Invoice & Fees Settings
    admissionFees: { type: Boolean, default: true },
    registrationFees: { type: Boolean, default: true },

    // 11. Virtual Classroom Settings
    virtualClassroomEnabled: { type: Boolean, default: true },

    // 12. Message Settings
    parentCanMessageClass: { type: Boolean, default: true },
    studentsCanMessageEachOther: { type: Boolean, default: true },

    // 13. Student Approval Settings
    studentApprovalEnabled: { type: Boolean, default: true },

    // 14. Video Settings
    howToVideosDisplay: { type: Boolean, default: true },

    // 15. Other Settings
    principalSignatureUrl: { type: String, trim: true, default: '' },
    mailNotificationEnabled: { type: Boolean, default: true },

    // 16. Footer Description (footer text in Basic Info)
    footerDescription: { type: String, trim: true, default: '' },

    // 17. Datatable Header Settings
    headerEnabled: { type: Boolean, default: true },

    // 18. Push Notification Settings
    pushNotificationEnabled: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'school_profiles' }
);

export const SchoolProfile =
  mongoose.models.SchoolProfile || mongoose.model('SchoolProfile', SchoolProfileSchema);
