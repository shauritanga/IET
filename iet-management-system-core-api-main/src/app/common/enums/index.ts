/**
 * Core enums for the IET Platform
 * Centralized enum definitions for consistency across the application
 */

// ============================================
// USER & MEMBER ENUMS
// ============================================

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum Title {
  ENG = 'Eng.',
  DR = 'Dr.',
  PROF = 'Prof.',
  MR = 'Mr.',
  MS = 'Ms.',
  MRS = 'Mrs.',
}

export enum UserRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  REVIEWER = 'REVIEWER',
}

// ============================================
// MEMBERSHIP ENUMS
// ============================================

export enum MembershipClass {
  GRADUATE = 'GRADUATE', // Graduate Member
  ASSOCIATE = 'ASSOCIATE', // Associate Member (AMIET)
  MEMBER = 'MIET', // Member (MIET)
  CORPORATE = 'CORPORATE', // Corporate Member (CMIET)
  SENIOR = 'SENIOR', // Senior Member (SMIET)
  FELLOW = 'FELLOW', // Fellow (FIET)
  HONORARY = 'HONORARY', // Honorary Fellow
}

export enum MembershipStatus {
  PENDING = 'PENDING', // Application pending review
  ACTIVE = 'ACTIVE', // Active membership
  EXPIRED = 'EXPIRED', // Membership expired (fee not paid)
  SUSPENDED = 'SUSPENDED', // Suspended membership
  REVOKED = 'REVOKED', // Membership revoked
}

export enum EngineeringDiscipline {
  CIVIL = 'Civil',
  MECHANICAL = 'Mechanical',
  ELECTRICAL = 'Electrical',
  ELECTRONICS = 'Electronics',
  CHEMICAL = 'Chemical',
  MINING = 'Mining',
  AGRICULTURAL = 'Agricultural',
  ENVIRONMENTAL = 'Environmental',
  COMPUTER = 'Computer',
  TELECOMMUNICATIONS = 'Telecommunications',
  PETROLEUM = 'Petroleum',
  BIOMEDICAL = 'Biomedical',
  INDUSTRIAL = 'Industrial',
  MARINE = 'Marine',
  AERONAUTICAL = 'Aeronautical',
  OTHER = 'Other',
}

// ============================================
// REGISTRATION ENUMS
// ============================================

export enum RegistrationStep {
  PERSONAL_DETAILS = 'PERSONAL_DETAILS',
  REGISTRATION_DETAILS = 'REGISTRATION_DETAILS',
  EDUCATION_EXPERIENCE = 'EDUCATION_EXPERIENCE',
  REFERENCES = 'REFERENCES',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PAYMENT = 'PAYMENT',
  DECLARATION = 'DECLARATION',
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT', // Application in progress
  IN_REVIEW = 'IN_REVIEW', // Application submitted and under review
  APPROVED = 'APPROVED', // Application approved
  REJECTED = 'REJECTED', // Application rejected
  CHANGES_REQUESTED = 'CHANGES_REQUESTED', // Changes requested
}

export enum ApplicationType {
  NEW = 'NEW', // New registration
  UPGRADING = 'UPGRADING', // Upgrading membership class
}

export enum RegistrationCategory {
  GRADUATE = 'GRADUATE', // Graduate application
  STANDARD = 'STANDARD', // Standard application
}

// ============================================
// PAYMENT ENUMS
// ============================================

export enum PaymentMethod {
  MPESA = 'MPESA',
  AIRTEL_MONEY = 'AIRTEL_MONEY',
  TIGO_PESA = 'TIGO_PESA',
  SELCOM = 'SELCOM',
  DPO_BANK = 'DPO_BANK',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentType {
  APPLICATION_FEE = 'APPLICATION_FEE',
  MEMBERSHIP_FEE = 'MEMBERSHIP_FEE',
  EVENT_REGISTRATION = 'EVENT_REGISTRATION',
  UPGRADE_FEE = 'UPGRADE_FEE',
}

export enum FeeStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  EXPIRING = 'EXPIRING',
}

// ============================================
// EVENT ENUMS
// ============================================

export enum EventCategory {
  CPD_COURSE = 'CPD_COURSE',
  CONFERENCE = 'CONFERENCE',
  WORKSHOP = 'WORKSHOP',
  SEMINAR = 'SEMINAR',
  ONLINE_SEMINAR = 'ONLINE_SEMINAR',
  AGM = 'AGM',
  NETWORKING = 'NETWORKING',
}

export enum EventRegistrationStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  ATTENDED = 'ATTENDED',
  NO_SHOW = 'NO_SHOW',
}

export enum AttendeeType {
  MEMBER = 'MEMBER',
  NON_MEMBER = 'NON_MEMBER',
  GUEST = 'GUEST',
  SPEAKER = 'SPEAKER',
  ORGANIZER = 'ORGANIZER',
}

// ============================================
// NOTIFICATION ENUMS
// ============================================

export enum NotificationType {
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  EVENT_REMINDER = 'EVENT_REMINDER',
  APPLICATION_UPDATE = 'APPLICATION_UPDATE',
  MEMBERSHIP_EXPIRY = 'MEMBERSHIP_EXPIRY',
  GENERAL_ANNOUNCEMENT = 'GENERAL_ANNOUNCEMENT',
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

// ============================================
// DOCUMENT ENUMS
// ============================================

export enum DocumentType {
  CV = 'CV',
  CERTIFICATE = 'CERTIFICATE',
  DEGREE = 'DEGREE',
  STATUTORY_BOARD = 'STATUTORY_BOARD',
  PROFILE_PHOTO = 'PROFILE_PHOTO',
  ADDITIONAL = 'ADDITIONAL',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// ============================================
// REFERENCE ENUMS
// ============================================

export enum ReferenceType {
  PROPOSER = 'PROPOSER',
  SUPPORTER = 'SUPPORTER',
}
