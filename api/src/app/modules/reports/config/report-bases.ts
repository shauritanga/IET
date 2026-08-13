import { DataSource, EntityTarget, SelectQueryBuilder } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { PaymentEntity } from '../../payments/entities/payment.entity';
import { RegistrationEntity } from '../../registration/entities/registration.entity';
import { EventEntity } from '../../events/entities/event.entity';
import { EventRegistrationEntity } from '../../events/entities/event-registration.entity';
import { UpgradeApplicationEntity } from '../../upgrade/entities/upgrade-application.entity';
import { MembershipFeeEntity } from '../../membership/entities/membership-fee.entity';
import { MembershipCategoryEntity } from '../../admin/entities/membership-category.entity';

export type ReportColumnType = 'string' | 'number' | 'date' | 'boolean' | 'enum';
export type ReportFilterType = 'enum' | 'date-range' | 'string';

export interface ReportColumnDef {
  /** Globally unique across all entities, e.g. "members.email". */
  key: string;
  label: string;
  type: ReportColumnType;
  /** Raw query-builder expression for a given table alias, e.g. (a) => `${a}.email`. Never built from client input. */
  expr: (alias: string) => string;
}

export interface ReportFilterDef {
  key: string;
  label: string;
  type: ReportFilterType;
  enumValues?: string[];
  applyTo: (qb: SelectQueryBuilder<any>, alias: string, value: unknown) => void;
}

export interface ReportEntityDef {
  id: string;
  label: string;
  description: string;
  entityClass: EntityTarget<any>;
  /** Alias used when this entity is the report base. */
  alias: string;
  columns: ReportColumnDef[];
  filters: ReportFilterDef[];
}

export interface ReportRelationDef {
  id: string;
  entityAId: string;
  entityAColumn: string;
  entityBId: string;
  entityBColumn: string;
  /** Alias for entity B's table when entity A is the base and B is joined in. Defaults to B's own alias. */
  aliasForB?: string;
  /** Alias for entity A's table when entity B is the base and A is joined in. Defaults to A's own alias. */
  aliasForA?: string;
  /** Checkbox label shown when base = A (describes what's being added). Defaults to entity B's label. */
  labelFromA?: string;
  /** Checkbox label shown when base = B. Defaults to entity A's label. */
  labelFromB?: string;
}

function dateRangeFilter(column: (a: string) => string): ReportFilterDef['applyTo'] {
  return (qb, alias, value) => {
    const range = value as { from?: string; to?: string };
    if (range?.from) qb.andWhere(`${column(alias)} >= :${alias}_from`, { [`${alias}_from`]: range.from });
    if (range?.to) qb.andWhere(`${column(alias)} <= :${alias}_to`, { [`${alias}_to`]: range.to });
  };
}

function enumFilter(column: (a: string) => string): ReportFilterDef['applyTo'] {
  return (qb, alias, value) => {
    qb.andWhere(`${column(alias)} = :${alias}_val`, { [`${alias}_val`]: value });
  };
}

export function createReportEntities(): ReportEntityDef[] {
  return [
    {
      id: 'members',
      label: 'Members',
      description: 'Registered members and their profile/membership details.',
      entityClass: UserEntity,
      alias: 'user',
      columns: [
        { key: 'members.membershipId', label: 'Membership ID', type: 'string', expr: (a) => `${a}.membershipId` },
        { key: 'members.fullName', label: 'Full Name', type: 'string', expr: (a) => `TRIM(CONCAT(${a}.firstName, ' ', COALESCE(${a}.lastName, '')))` },
        { key: 'members.email', label: 'Email', type: 'string', expr: (a) => `${a}.email` },
        { key: 'members.phoneNumber', label: 'Phone', type: 'string', expr: (a) => `${a}.phoneNumber` },
        { key: 'members.membershipClass', label: 'Membership Class', type: 'enum', expr: (a) => `${a}.membershipClass` },
        { key: 'members.membershipStatus', label: 'Membership Status', type: 'enum', expr: (a) => `${a}.membershipStatus` },
        { key: 'members.engineeringDiscipline', label: 'Discipline', type: 'enum', expr: (a) => `${a}.engineeringDiscipline` },
        { key: 'members.employer', label: 'Employer', type: 'string', expr: (a) => `${a}.employer` },
        { key: 'members.joiningDate', label: 'Joining Date', type: 'date', expr: (a) => `${a}.joiningDate` },
        { key: 'members.membershipExpiryDate', label: 'Expiry Date', type: 'date', expr: (a) => `${a}.membershipExpiryDate` },
      ],
      filters: [
        { key: 'membershipStatus', label: 'Membership Status', type: 'enum', applyTo: enumFilter((a) => `${a}.membershipStatus`) },
        { key: 'membershipClass', label: 'Membership Class', type: 'enum', applyTo: enumFilter((a) => `${a}.membershipClass`) },
        { key: 'engineeringDiscipline', label: 'Discipline', type: 'enum', applyTo: enumFilter((a) => `${a}.engineeringDiscipline`) },
        {
          key: 'search',
          label: 'Search (name/email)',
          type: 'string',
          applyTo: (qb, alias, value) => {
            qb.andWhere(
              `(${alias}.email ILIKE :${alias}_search OR ${alias}.firstName ILIKE :${alias}_search OR ${alias}.lastName ILIKE :${alias}_search)`,
              { [`${alias}_search`]: `%${value}%` },
            );
          },
        },
      ],
    },
    {
      id: 'payments',
      label: 'Payments',
      description: 'Payment transactions.',
      entityClass: PaymentEntity,
      alias: 'payment',
      columns: [
        { key: 'payments.paymentType', label: 'Payment Type', type: 'enum', expr: (a) => `${a}.paymentType` },
        { key: 'payments.amount', label: 'Amount', type: 'number', expr: (a) => `${a}.amount` },
        { key: 'payments.currency', label: 'Currency', type: 'string', expr: (a) => `${a}.currency` },
        { key: 'payments.status', label: 'Payment Status', type: 'enum', expr: (a) => `${a}.status` },
        { key: 'payments.paymentMethod', label: 'Payment Method', type: 'enum', expr: (a) => `${a}.paymentMethod` },
        { key: 'payments.transactionRef', label: 'Transaction Ref', type: 'string', expr: (a) => `${a}.transactionRef` },
        { key: 'payments.receiptNumber', label: 'Receipt Number', type: 'string', expr: (a) => `${a}.receiptNumber` },
        { key: 'payments.completedAt', label: 'Completed At', type: 'date', expr: (a) => `${a}.completedAt` },
      ],
      filters: [
        { key: 'status', label: 'Payment Status', type: 'enum', applyTo: enumFilter((a) => `${a}.status`) },
        { key: 'paymentType', label: 'Payment Type', type: 'enum', applyTo: enumFilter((a) => `${a}.paymentType`) },
        { key: 'paymentMethod', label: 'Payment Method', type: 'enum', applyTo: enumFilter((a) => `${a}.paymentMethod`) },
        { key: 'completedAt', label: 'Completed Date Range', type: 'date-range', applyTo: dateRangeFilter((a) => `${a}.completedAt`) },
      ],
    },
    {
      id: 'applications',
      label: 'Applications',
      description: 'Membership applications and their review progress.',
      entityClass: RegistrationEntity,
      alias: 'registration',
      columns: [
        { key: 'applications.referenceNumber', label: 'Reference Number', type: 'string', expr: (a) => `${a}.referenceNumber` },
        { key: 'applications.status', label: 'Application Status', type: 'enum', expr: (a) => `${a}.status` },
        { key: 'applications.currentStep', label: 'Current Step', type: 'enum', expr: (a) => `${a}.currentStep` },
        { key: 'applications.applicationType', label: 'Application Type', type: 'enum', expr: (a) => `${a}.applicationType` },
        { key: 'applications.registrationCategory', label: 'Registration Category', type: 'enum', expr: (a) => `${a}.registrationCategory` },
        { key: 'applications.reviewStage', label: 'Review Stage', type: 'enum', expr: (a) => `${a}.reviewStage` },
        { key: 'applications.submittedAt', label: 'Submitted At', type: 'date', expr: (a) => `${a}.submittedAt` },
        { key: 'applications.reviewedAt', label: 'Reviewed At', type: 'date', expr: (a) => `${a}.reviewedAt` },
      ],
      filters: [
        { key: 'status', label: 'Application Status', type: 'enum', applyTo: enumFilter((a) => `${a}.status`) },
        { key: 'reviewStage', label: 'Review Stage', type: 'enum', applyTo: enumFilter((a) => `${a}.reviewStage`) },
        { key: 'submittedAt', label: 'Submitted Date Range', type: 'date-range', applyTo: dateRangeFilter((a) => `${a}.submittedAt`) },
      ],
    },
    {
      id: 'events',
      label: 'Events',
      description: 'Events and training sessions.',
      entityClass: EventEntity,
      alias: 'event',
      columns: [
        { key: 'events.title', label: 'Title', type: 'string', expr: (a) => `${a}.title` },
        { key: 'events.category', label: 'Category', type: 'enum', expr: (a) => `${a}.category` },
        { key: 'events.startDate', label: 'Start Date', type: 'date', expr: (a) => `${a}.startDate` },
        { key: 'events.endDate', label: 'End Date', type: 'date', expr: (a) => `${a}.endDate` },
        { key: 'events.location', label: 'Location', type: 'string', expr: (a) => `${a}.location` },
        { key: 'events.cpdPoints', label: 'CPD Points', type: 'number', expr: (a) => `${a}.cpdPoints` },
        { key: 'events.registrationFee', label: 'Registration Fee', type: 'number', expr: (a) => `${a}.registrationFee` },
        { key: 'events.isOnline', label: 'Online', type: 'boolean', expr: (a) => `${a}.isOnline` },
      ],
      filters: [
        { key: 'category', label: 'Category', type: 'enum', applyTo: enumFilter((a) => `${a}.category`) },
        { key: 'startDate', label: 'Event Date Range', type: 'date-range', applyTo: dateRangeFilter((a) => `${a}.startDate`) },
      ],
    },
    {
      id: 'event_registrations',
      label: 'Event Registrations',
      description: 'Attendee registrations for events.',
      entityClass: EventRegistrationEntity,
      alias: 'eventRegistration',
      columns: [
        { key: 'event_registrations.status', label: 'Registration Status', type: 'enum', expr: (a) => `${a}.status` },
        { key: 'event_registrations.attendeeType', label: 'Attendee Type', type: 'enum', expr: (a) => `${a}.attendeeType` },
        { key: 'event_registrations.amountPaid', label: 'Amount Paid', type: 'number', expr: (a) => `${a}.amountPaid` },
        { key: 'event_registrations.confirmedAt', label: 'Confirmed At', type: 'date', expr: (a) => `${a}.confirmedAt` },
        { key: 'event_registrations.attendedAt', label: 'Attended At', type: 'date', expr: (a) => `${a}.attendedAt` },
        { key: 'event_registrations.ticketNumber', label: 'Ticket Number', type: 'string', expr: (a) => `${a}.ticketNumber` },
      ],
      filters: [
        { key: 'status', label: 'Registration Status', type: 'enum', applyTo: enumFilter((a) => `${a}.status`) },
        { key: 'attendeeType', label: 'Attendee Type', type: 'enum', applyTo: enumFilter((a) => `${a}.attendeeType`) },
      ],
    },
    {
      id: 'upgrade_applications',
      label: 'Upgrade Applications',
      description: 'Membership category upgrade applications.',
      entityClass: UpgradeApplicationEntity,
      alias: 'upgrade',
      columns: [
        { key: 'upgrade_applications.status', label: 'Status', type: 'enum', expr: (a) => `${a}.status` },
        { key: 'upgrade_applications.submittedAt', label: 'Submitted At', type: 'date', expr: (a) => `${a}.submittedAt` },
        { key: 'upgrade_applications.reviewedAt', label: 'Reviewed At', type: 'date', expr: (a) => `${a}.reviewedAt` },
        { key: 'upgrade_applications.rejectionReason', label: 'Rejection Reason', type: 'string', expr: (a) => `${a}.rejectionReason` },
      ],
      filters: [
        { key: 'status', label: 'Status', type: 'enum', applyTo: enumFilter((a) => `${a}.status`) },
        { key: 'submittedAt', label: 'Submitted Date Range', type: 'date-range', applyTo: dateRangeFilter((a) => `${a}.submittedAt`) },
      ],
    },
    {
      id: 'membership_fees',
      label: 'Membership Fees',
      description: 'Annual membership fee records.',
      entityClass: MembershipFeeEntity,
      alias: 'fee',
      columns: [
        { key: 'membership_fees.year', label: 'Year', type: 'number', expr: (a) => `${a}.year` },
        { key: 'membership_fees.membershipClass', label: 'Membership Class', type: 'enum', expr: (a) => `${a}.membershipClass` },
        { key: 'membership_fees.amount', label: 'Amount', type: 'number', expr: (a) => `${a}.amount` },
        { key: 'membership_fees.status', label: 'Status', type: 'enum', expr: (a) => `${a}.status` },
        { key: 'membership_fees.dueDate', label: 'Due Date', type: 'date', expr: (a) => `${a}.dueDate` },
        { key: 'membership_fees.paidAt', label: 'Paid At', type: 'date', expr: (a) => `${a}.paidAt` },
      ],
      filters: [
        { key: 'status', label: 'Status', type: 'enum', applyTo: enumFilter((a) => `${a}.status`) },
        { key: 'year', label: 'Year', type: 'string', applyTo: (qb, alias, value) => qb.andWhere(`${alias}.year = :${alias}_year`, { [`${alias}_year`]: value }) },
      ],
    },
    {
      id: 'membership_categories',
      label: 'Membership Categories',
      description: 'Membership category directory (fees, experience requirements).',
      entityClass: MembershipCategoryEntity,
      alias: 'category',
      columns: [
        { key: 'membership_categories.name', label: 'Name', type: 'string', expr: (a) => `${a}.name` },
        { key: 'membership_categories.code', label: 'Code', type: 'string', expr: (a) => `${a}.code` },
        { key: 'membership_categories.level', label: 'Level', type: 'number', expr: (a) => `${a}.level` },
        { key: 'membership_categories.yearlyFee', label: 'Yearly Fee', type: 'number', expr: (a) => `${a}.yearlyFee` },
        { key: 'membership_categories.minYearsExperience', label: 'Min Years Experience', type: 'number', expr: (a) => `${a}.minYearsExperience` },
        { key: 'membership_categories.isActive', label: 'Active', type: 'boolean', expr: (a) => `${a}.isActive` },
      ],
      filters: [
        { key: 'isActive', label: 'Active', type: 'enum', enumValues: ['true', 'false'], applyTo: enumFilter((a) => `${a}.isActive`) },
      ],
    },
  ];
}

export function createReportRelations(): ReportRelationDef[] {
  return [
    { id: 'payments_members', entityAId: 'payments', entityAColumn: 'userId', entityBId: 'members', entityBColumn: 'id' },
    { id: 'applications_members', entityAId: 'applications', entityAColumn: 'userId', entityBId: 'members', entityBColumn: 'id' },
    { id: 'membership_fees_members', entityAId: 'membership_fees', entityAColumn: 'userId', entityBId: 'members', entityBColumn: 'id' },
    { id: 'event_registrations_members', entityAId: 'event_registrations', entityAColumn: 'userId', entityBId: 'members', entityBColumn: 'id' },
    { id: 'event_registrations_events', entityAId: 'event_registrations', entityAColumn: 'eventId', entityBId: 'events', entityBColumn: 'id' },
    { id: 'upgrade_applications_members', entityAId: 'upgrade_applications', entityAColumn: 'userId', entityBId: 'members', entityBColumn: 'id' },
    {
      id: 'upgrade_applications_from_category',
      entityAId: 'upgrade_applications',
      entityAColumn: 'fromCategoryId',
      entityBId: 'membership_categories',
      entityBColumn: 'id',
      aliasForB: 'fromCategory',
      aliasForA: 'upgradeFrom',
      labelFromA: 'From Category',
      labelFromB: 'Upgrade Applications (from this category)',
    },
    {
      id: 'upgrade_applications_to_category',
      entityAId: 'upgrade_applications',
      entityAColumn: 'toCategoryId',
      entityBId: 'membership_categories',
      entityBColumn: 'id',
      aliasForB: 'toCategory',
      aliasForA: 'upgradeTo',
      labelFromA: 'To Category',
      labelFromB: 'Upgrade Applications (to this category)',
    },
    { id: 'members_membership_category', entityAId: 'members', entityAColumn: 'membershipCategoryId', entityBId: 'membership_categories', entityBColumn: 'id' },
  ];
}
