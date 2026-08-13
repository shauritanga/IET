export interface CannedReportDef {
  id: string;
  title: string;
  description: string;
  baseId: string;
  relationIds: string[];
  columns: string[];
  filters?: Record<string, unknown>;
}

/** One template per real entity — each a genuinely distinct, frequently-needed report. */
export const CANNED_REPORTS: CannedReportDef[] = [
  {
    id: 'membership',
    title: 'Membership Report',
    description: 'Full member directory with membership status and discipline.',
    baseId: 'members',
    relationIds: [],
    columns: [
      'members.membershipId',
      'members.fullName',
      'members.email',
      'members.phoneNumber',
      'members.membershipClass',
      'members.membershipStatus',
      'members.engineeringDiscipline',
      'members.joiningDate',
      'members.membershipExpiryDate',
    ],
  },
  {
    id: 'financial',
    title: 'Financial Report',
    description: 'Payment transactions across all payment types.',
    baseId: 'payments',
    relationIds: ['payments_members'],
    columns: [
      'members.email',
      'payments.paymentType',
      'payments.amount',
      'payments.currency',
      'payments.status',
      'payments.paymentMethod',
      'payments.receiptNumber',
      'payments.completedAt',
    ],
  },
  {
    id: 'applications',
    title: 'Applications Report',
    description: 'Membership applications and their review progress.',
    baseId: 'applications',
    relationIds: ['applications_members'],
    columns: [
      'members.email',
      'applications.referenceNumber',
      'applications.status',
      'applications.reviewStage',
      'applications.applicationType',
      'applications.submittedAt',
      'applications.reviewedAt',
    ],
  },
  {
    id: 'events',
    title: 'Events Report',
    description: 'Events and training sessions on the calendar.',
    baseId: 'events',
    relationIds: [],
    columns: [
      'events.title',
      'events.category',
      'events.startDate',
      'events.endDate',
      'events.location',
      'events.cpdPoints',
      'events.registrationFee',
    ],
  },
  {
    id: 'event_registrations',
    title: 'Event Attendance Report',
    description: 'Who registered and attended which event.',
    baseId: 'event_registrations',
    relationIds: ['event_registrations_events', 'event_registrations_members'],
    columns: [
      'members.email',
      'events.title',
      'event_registrations.status',
      'event_registrations.attendeeType',
      'event_registrations.amountPaid',
      'event_registrations.confirmedAt',
      'event_registrations.attendedAt',
    ],
  },
  {
    id: 'upgrade_applications',
    title: 'Upgrade Applications Report',
    description: 'Membership category upgrade requests and their outcome.',
    baseId: 'upgrade_applications',
    relationIds: ['upgrade_applications_members', 'upgrade_applications_to_category'],
    columns: [
      'members.email',
      'upgrade_applications.status',
      'membership_categories.name',
      'upgrade_applications.submittedAt',
      'upgrade_applications.reviewedAt',
    ],
  },
  {
    id: 'membership_fees',
    title: 'Membership Fees Report',
    description: 'Annual membership fee records and payment status.',
    baseId: 'membership_fees',
    relationIds: ['membership_fees_members'],
    columns: [
      'members.email',
      'membership_fees.year',
      'membership_fees.membershipClass',
      'membership_fees.amount',
      'membership_fees.status',
      'membership_fees.dueDate',
      'membership_fees.paidAt',
    ],
  },
  {
    id: 'membership_categories',
    title: 'Membership Categories Report',
    description: 'Category directory with fee and experience requirements.',
    baseId: 'membership_categories',
    relationIds: [],
    columns: [
      'membership_categories.name',
      'membership_categories.code',
      'membership_categories.level',
      'membership_categories.yearlyFee',
      'membership_categories.minYearsExperience',
      'membership_categories.isActive',
    ],
  },
];
