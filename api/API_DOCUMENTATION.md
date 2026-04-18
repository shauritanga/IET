# IET Management System — Frontend API Integration Guide

> **Base URL:** `http://localhost:3000/api/v1` (development)
> **Production:** `https://api.iet.or.tz/api/v1`
> **Interactive Docs (Swagger):** `http://localhost:3000/api/docs`

---

## Table of Contents

1. [General Conventions](#1-general-conventions)
2. [Authentication](#2-authentication)
3. [Member Registration (7-Step Flow)](#3-member-registration-7-step-flow)
4. [User Profile](#4-user-profile)
5. [Membership](#5-membership)
6. [Events](#6-events)
7. [Payments](#7-payments)
8. [Notifications](#8-notifications)
9. [Public / Guest Endpoints](#9-public--guest-endpoints)
10. [Enums Reference](#10-enums-reference)
11. [Error Handling](#11-error-handling)

---

## 1. General Conventions

### Request Headers

| Header | Required | Value |
|---|---|---|
| `Content-Type` | Always | `application/json` |
| `Authorization` | Protected routes | `Bearer <accessToken>` |

### Standard Response Envelope

All responses follow this envelope structure:

```json
{
  "status": 200,
  "message": "Success",
  "timestamp": "2025-01-27T10:00:00.000Z",
  "path": "/api/v1/...",
  "data": { ... },
  "meta": {},
  "errors": null
}
```

### Pagination Response

Paginated endpoints return:

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Pagination Query Params

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page |

---

## 2. Authentication

All auth endpoints live under `/auth`.

---

### 2.1 Register Account

> This creates a standalone user account (not the 7-step membership registration). Used for admin/staff accounts.

```
POST /auth/register
```

**Body:**

```json
{
  "email": "joram@gmail.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "firstName": "Joram",
  "lastName": "Jackson"
}
```

**Success Response `201`:**

```json
{
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "joram@gmail.com",
    "verificationSent": true
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

---

### 2.2 Verify Email

```
POST /auth/verify-email
```

**Body:**

```json
{
  "email": "joram@gmail.com",
  "code": "IET-119718"
}
```

**Success Response `200`:**

```json
{
  "data": { "verified": true },
  "message": "Email verified successfully"
}
```

---

### 2.3 Resend Verification Code

```
POST /auth/resend-verification
```

**Body:**

```json
{
  "email": "joram@gmail.com"
}
```

**Success Response `200`:**

```json
{
  "message": "Verification code sent to your email"
}
```

---

### 2.4 Login

```
POST /auth/login
```

**Body:**

```json
{
  "email": "joram@gmail.com",
  "password": "Password123!"
}
```

**Success Response `200`:**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "joram@gmail.com",
      "fullName": "Eng. Joram Allan Jackson",
      "membershipId": "IET/ENG/0234",
      "membershipStatus": "ACTIVE",
      "role": "MEMBER",
      "profilePhotoUrl": null
    }
  }
}
```

> Store `accessToken` in memory and `refreshToken` in an HttpOnly cookie or secure storage. The `accessToken` expires in ~1 hour.

---

### 2.5 Refresh Access Token

```
POST /auth/refresh
```

**Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response `200`:**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2.6 Logout

```
POST /auth/logout
Authorization: Bearer <accessToken>
```

**Success Response `200`:**

```json
{ "message": "Logged out successfully" }
```

---

### 2.7 Forgot Password

```
POST /auth/forgot-password
```

**Body:**

```json
{ "email": "joram@gmail.com" }
```

**Success Response `200`:**

```json
{ "message": "Password reset instructions sent to your email" }
```

---

### 2.8 Reset Password

```
POST /auth/reset-password
```

**Body:**

```json
{
  "token": "<token-from-email>",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Success Response `200`:**

```json
{ "message": "Password reset successful" }
```

---

### 2.9 Change Password (Authenticated)

```
POST /auth/change-password
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

---

### 2.10 Two-Factor Authentication

#### Enable 2FA

```
POST /auth/2fa/enable
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "otpauthUrl": "otpauth://totp/IET%20Portal%20(joram@gmail.com)?secret=JBSWY3DPEHPK3PXP&issuer=IET"
  }
}
```

Show `otpauthUrl` as a QR code for the user to scan with their authenticator app.

#### Validate 2FA Token

```
POST /auth/2fa/validate
```

**Body:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "token": "123456"
}
```

#### Disable 2FA

```
POST /auth/2fa/disable
Authorization: Bearer <accessToken>
```

---

## 3. Member Registration (7-Step Flow)

The membership application is a 7-step wizard. Each step returns the current progress.

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7
Personal  Details  Edu &    Refs    Email    Payment  Declaration
Details            Exp              Verify
```

**Progress Response Shape** (returned from Steps 1–5):

```json
{
  "applicationId": "a184c2b9-0cb9-4690-86d0-2e58275f98cb",
  "currentStep": "REGISTRATION_DETAILS",
  "completedSteps": ["PERSONAL_DETAILS", "REGISTRATION_DETAILS"],
  "nextStep": "EDUCATION_EXPERIENCE"
}
```

---

### Step 1 — Personal Details (Public, No Auth)

```
POST /registrations
```

**Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "gender": "MALE",
  "dateOfBirth": "1990-05-15",
  "nationality": "Tanzanian",
  "phoneNumber": "+255712345678",
  "title": "Eng.",
  "middleName": "Allan"
}
```

**Required fields:** `email`, `password`, `confirmPassword`, `firstName`, `lastName`, `gender`, `dateOfBirth`, `nationality`

**Success Response `201`:**

```json
{
  "data": {
    "applicationId": "a184c2b9-0cb9-4690-86d0-2e58275f98cb",
    "userId": "e743d4a1-32c8-40dd-8693-0ed392558132",
    "currentStep": "PERSONAL_DETAILS",
    "completedSteps": ["PERSONAL_DETAILS"],
    "nextStep": "REGISTRATION_DETAILS"
  },
  "message": "Personal details saved successfully"
}
```

> After Step 1, log the user in with the same email/password to get a JWT token, then use that token for Steps 2–7.

---

### Step 2 — Registration Details

```
PATCH /registrations/:applicationId/steps/registration-details
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "engineeringDiscipline": "Mechanical",
  "applicationType": "NEW",
  "registrationCategory": "GRADUATE",
  "appliedMembershipClass": "GRADUATE",
  "registeredWithStatutoryBoards": false,
  "memberOfOtherInstitutions": false,
  "otherInstitutions": []
}
```

> `engineeringDiscipline` uses **title-case** values (e.g. `"Mechanical"`, `"Civil"`, `"Electrical"`). See [Enums Reference](#10-enums-reference).

**If `memberOfOtherInstitutions` is `true`**, include `otherInstitutions`:

```json
{
  "otherInstitutions": [
    {
      "institutionName": "EAC Engineers Board",
      "registrationDate": "2020-09-01",
      "classRegistered": "Class B"
    }
  ]
}
```

**Success Response `200`:**

```json
{
  "data": {
    "applicationId": "a184c2b9-...",
    "currentStep": "REGISTRATION_DETAILS",
    "completedSteps": ["PERSONAL_DETAILS", "REGISTRATION_DETAILS"],
    "nextStep": "EDUCATION_EXPERIENCE"
  }
}
```

---

### Step 3a — Add Education

Can be called multiple times to add multiple entries.

```
POST /registrations/:applicationId/education
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "institutionName": "University of Dar es Salaam",
  "qualification": "Bachelor of Science in Mechanical Engineering",
  "fieldOfStudy": "Mechanical Engineering",
  "startDate": "2015-09-01",
  "endDate": "2019-07-15",
  "grade": "First Class Honours",
  "location": "Dar es Salaam, Tanzania"
}
```

**Update Education:**

```
PATCH /registrations/:applicationId/education/:educationId
Authorization: Bearer <accessToken>
```

**Delete Education:**

```
DELETE /registrations/:applicationId/education/:educationId
Authorization: Bearer <accessToken>
```

---

### Step 3b — Add Professional Experience

Can be called multiple times to add multiple entries.

```
POST /registrations/:applicationId/experience
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "employerName": "TANESCO",
  "position": "Mechanical Engineer",
  "startDate": "2019-09-01",
  "endDate": null,
  "isCurrent": true,
  "responsibilities": "<p>Led mechanical design projects for power infrastructure</p>",
  "location": "Dar es Salaam, Tanzania",
  "department": "Engineering"
}
```

**Update Experience:**

```
PATCH /registrations/:applicationId/experience/:experienceId
Authorization: Bearer <accessToken>
```

**Delete Experience:**

```
DELETE /registrations/:applicationId/experience/:experienceId
Authorization: Bearer <accessToken>
```

---

### Step 3c — Upload Documents

```
POST /registrations/:applicationId/documents
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Form Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | The document file |
| `documentType` | string | Yes | See document types below |
| `description` | string | No | Optional description |

**Allowed document types:** `CV`, `CERTIFICATE`, `DEGREE`, `STATUTORY_BOARD`, `ADDITIONAL`

**Allowed file types:** PDF, JPG, PNG, DOC, DOCX (max 10MB)

**Delete Document:**

```
DELETE /registrations/:applicationId/documents/:documentId
Authorization: Bearer <accessToken>
```

---

### Step 4 — References

Submit both proposer and supporter in a single request.

```
POST /registrations/:applicationId/references
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "proposer": {
    "referenceType": "PROPOSER",
    "fullName": "Eng. Emmanuel Kambainei",
    "membershipCategory": "FELLOW",
    "membershipNumber": "IET/ENG/0123",
    "knownFrom": "2020-01-01",
    "email": "emmanuel@example.com",
    "phoneNumber": "+255712345678"
  },
  "supporter": {
    "referenceType": "SUPPORTER",
    "fullName": "Eng. Agnes Mwango",
    "membershipCategory": "MIET",
    "membershipNumber": "IET/ENG/0456",
    "knownFrom": "2021-06-01",
    "email": "agnes@example.com",
    "phoneNumber": "+255723456789"
  }
}
```

> `membershipNumber` must match the pattern `IET/ENG/XXXX` (4 digits).

---

### Step 5 — Email Verification

The applicant receives a verification code by email during Step 1. Use it here.

```
POST /registrations/:applicationId/verify-email
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "verificationCode": "IET-119718"
}
```

**Resend Code:**

```
POST /registrations/:applicationId/resend-verification
Authorization: Bearer <accessToken>
```

**Success Response `200`:**

```json
{
  "data": {
    "emailVerified": true,
    "completedSteps": ["PERSONAL_DETAILS", "REGISTRATION_DETAILS", "EDUCATION_EXPERIENCE", "REFERENCES", "EMAIL_VERIFICATION"],
    "nextStep": "PAYMENT"
  },
  "message": "Email verified successfully"
}
```

---

### Step 6 — Payment

Payment is handled via the [Payments module](#7-payments). Use:

```
POST /payments
```

with `paymentType: "APPLICATION_FEE"` and include `registrationId` in the metadata.

---

### Step 7 — Declaration & Submission

```
POST /registrations/:applicationId/submit
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "agreed": true,
  "signature": "John Allan Doe",
  "signatureDate": "2025-01-27"
}
```

**Success Response `200`:**

```json
{
  "data": {
    "applicationId": "a184c2b9-...",
    "status": "SUBMITTED",
    "submittedAt": "2025-01-27T10:00:00Z",
    "referenceNumber": "IET/APP/2025/0001"
  },
  "message": "Application submitted successfully"
}
```

> A confirmation email is sent automatically upon submission.

---

### Get Registration Status

```
GET /registrations/:applicationId
Authorization: Bearer <accessToken>
```

**Get All User's Registrations:**

```
GET /registrations
Authorization: Bearer <accessToken>
```

---

## 4. User Profile

### 4.1 Get Own Profile

```
GET /users/profile
Authorization: Bearer <accessToken>
```

Returns the full `UserEntity` object.

---

### 4.2 Update Own Profile

```
PUT /users/profile
Authorization: Bearer <accessToken>
```

**Body (all fields optional):**

```json
{
  "firstName": "Joram",
  "lastName": "Jackson",
  "phoneNumber": "+255712345678",
  "employer": "ALAF Limited",
  "position": "Senior Mechanical Engineer",
  "location": "Dar es Salaam, Tanzania"
}
```

---

### 4.3 Upload Profile Photo

```
POST /users/profile/photo
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Form Fields:**

| Field | Type | Description |
|---|---|---|
| `photo` | File | Image file (JPG, PNG, WEBP, max 5MB) |

**Response `200`:**

```json
{
  "data": {
    "profilePhotoUrl": "https://eit-bucket.sfo3.digitaloceanspaces.com/avatars/uuid/photo.jpg"
  },
  "message": "Profile photo updated successfully"
}
```

---

### 4.4 Get User by ID

```
GET /users/:id
Authorization: Bearer <accessToken>
```

---

### 4.5 Get All Users (Admin)

```
GET /users?page=1&limit=10
Authorization: Bearer <accessToken>
```

---

## 5. Membership

All membership endpoints require authentication.

---

### 5.1 Get Membership Details

```
GET /memberships/me
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "data": {
    "membershipId": "IET/ENG/0234",
    "membershipClass": "MIET",
    "status": "ACTIVE",
    "engineeringDiscipline": "Mechanical",
    "location": "Dar es Salaam, Tanzania",
    "joiningDate": "2022-07-10",
    "expiryDate": "2026-07-10",
    "annualFee": 10000,
    "nextPaymentDue": "2025-07-10",
    "daysUntilExpiry": 165
  }
}
```

---

### 5.2 Get Fee History

```
GET /memberships/me/fees?page=1&limit=10&year=2025
Authorization: Bearer <accessToken>
```

---

### 5.3 Pay Membership Fee

```
POST /memberships/me/fees/pay
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "paymentMethod": "MPESA",
  "phoneNumber": "+255712345678"
}
```

---

### 5.4 Get Fee Receipt

```
GET /memberships/me/fees/:year/receipt
Authorization: Bearer <accessToken>
```

Example: `GET /memberships/me/fees/2025/receipt`

---

## 6. Events

### 6.1 List Events (Public)

```
GET /events?page=1&limit=10&category=CPD_COURSE&fromDate=2025-01-01&toDate=2025-12-31&search=workshop
```

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `category` | string | Comma-separated: `CPD_COURSE,WORKSHOP` |
| `fromDate` | string | Start date filter `YYYY-MM-DD` |
| `toDate` | string | End date filter `YYYY-MM-DD` |
| `location` | string | Location filter |
| `search` | string | Keyword search |

---

### 6.2 Get Event Details (Public)

```
GET /events/:eventId
```

---

### 6.3 Register for Event

```
POST /events/:eventId/register
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "attendeeType": "MEMBER",
  "phoneNumber": "+255712345678"
}
```

**Response:**

```json
{
  "data": {
    "registrationId": "uuid",
    "eventTitle": "Structural Design CPD Workshop",
    "status": "PENDING_PAYMENT",
    "amount": 50000,
    "currency": "TZS"
  },
  "message": "Registration initiated. Please complete payment."
}
```

---

### 6.4 My Event Registrations

```
GET /events/registrations/me?status=CONFIRMED&page=1&limit=10
Authorization: Bearer <accessToken>
```

---

### 6.5 Cancel Registration

```
POST /events/registrations/:registrationId/cancel
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "reason": "Unable to attend"
}
```

---

### 6.6 Get Event Certificate

```
GET /events/registrations/:registrationId/certificate
Authorization: Bearer <accessToken>
```

---

### 6.7 Submit Event Feedback

```
POST /events/registrations/:registrationId/feedback
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "rating": 5,
  "comment": "Excellent workshop, very informative."
}
```

---

## 7. Payments

### 7.1 Initiate Payment

```
POST /payments
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "paymentType": "APPLICATION_FEE",
  "paymentMethod": "MPESA",
  "phoneNumber": "+255712345678",
  "amount": 10000,
  "currency": "TZS",
  "description": "Membership application fee",
  "metadata": {
    "registrationId": "a184c2b9-..."
  }
}
```

**Payment Types:** `APPLICATION_FEE`, `MEMBERSHIP_FEE`, `EVENT_REGISTRATION`, `UPGRADE_FEE`

**Payment Methods:** `MPESA`, `AIRTEL_MONEY`, `TIGO_PESA`, `SELCOM`, `DPO_BANK`

**Response:**

```json
{
  "data": {
    "paymentId": "uuid",
    "amount": 10000,
    "currency": "TZS",
    "paymentMethod": "MPESA",
    "status": "PROCESSING",
    "mobileMoneyRef": "REF123456"
  },
  "message": "Payment initiated. Please check your phone to complete payment."
}
```

---

### 7.2 Get Payment History

```
GET /payments/me?page=1&limit=10&type=APPLICATION_FEE
Authorization: Bearer <accessToken>
```

---

### 7.3 Get Payment Details

```
GET /payments/:paymentId
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "data": {
    "paymentId": "uuid",
    "type": "APPLICATION_FEE",
    "amount": 10000,
    "currency": "TZS",
    "status": "COMPLETED",
    "paymentMethod": "MPESA",
    "transactionRef": "TXN123456",
    "receiptNumber": "IET/RCT/2025/0001",
    "receiptUrl": "https://cdn.iet.or.tz/receipts/uuid.pdf",
    "createdAt": "2025-01-27T10:00:00Z",
    "completedAt": "2025-01-27T10:02:00Z"
  }
}
```

---

### 7.4 Payment Webhooks (Server-to-Server — Do Not Call from Frontend)

| Method | Path | Description |
|---|---|---|
| `POST` | `/payments/webhooks/mpesa` | M-Pesa callback |
| `POST` | `/payments/webhooks/selcom` | Selcom callback |
| `POST` | `/payments/webhooks/dpo` | DPO callback |

> These are called by payment gateways directly. The frontend should poll `GET /payments/:paymentId` to check payment status.

---

## 8. Notifications

All notification endpoints require authentication.

---

### 8.1 Get Notifications

```
GET /notifications?page=1&limit=20&unreadOnly=true
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "PAYMENT_REMINDER",
      "title": "Membership Fee Due Soon",
      "message": "Your 2025 membership fee is due on July 10, 2025",
      "isRead": false,
      "createdAt": "2025-01-27T10:00:00Z",
      "actionUrl": "/memberships/fees"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1,
    "unreadCount": 5
  }
}
```

---

### 8.2 Get Unread Count

```
GET /notifications/unread-count
Authorization: Bearer <accessToken>
```

**Response:** `{ "data": { "count": 5 } }`

Use this to display the notification badge.

---

### 8.3 Mark Notification as Read

```
PATCH /notifications/:notificationId/read
Authorization: Bearer <accessToken>
```

---

### 8.4 Mark All as Read

```
POST /notifications/mark-all-read
Authorization: Bearer <accessToken>
```

---

### 8.5 Delete Notification

```
DELETE /notifications/:notificationId
Authorization: Bearer <accessToken>
```

---

### 8.6 Get Notification Preferences

```
GET /notifications/preferences
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "data": {
    "email": {
      "eventReminders": true,
      "paymentReminders": true,
      "newsletters": false,
      "applicationUpdates": true
    },
    "sms": {
      "eventReminders": true,
      "paymentReminders": true
    },
    "push": {
      "eventReminders": true,
      "paymentReminders": true,
      "generalAnnouncements": false
    }
  }
}
```

---

### 8.7 Update Notification Preferences

```
PATCH /notifications/preferences
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "email": { "newsletters": true },
  "sms": { "eventReminders": false }
}
```

---

## 9. Public / Guest Endpoints

No authentication required. All under `/public`.

---

### 9.1 Public Events Calendar

```
GET /public/calendar?year=2025&month=10
```

---

### 9.2 System Instructions

```
GET /public/instructions
```

---

### 9.3 Guest Event Registration

```
POST /public/events/:eventId/register
```

**Body:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+255712345678",
  "organization": "ABC Construction Ltd"
}
```

**Response:**

```json
{
  "data": {
    "registrationId": "uuid",
    "ticketNumber": "TKT-2025-00001",
    "controlNumber": "IET-EVT-2025-123456",
    "event": {
      "title": "Structural Design Workshop",
      "date": "2025-10-27",
      "location": "Karimjee Hall"
    },
    "amount": 50000,
    "status": "PENDING"
  },
  "message": "Registration successful. Please complete payment using the control number."
}
```

---

### 9.4 Guest Payment

```
POST /public/registrations/:registrationId/pay
```

**Body:**

```json
{
  "paymentMethod": "MPESA",
  "phoneNumber": "+255712345678"
}
```

---

### 9.5 Lookup Guest Registration

```
GET /public/registrations/lookup?ticketNumber=TKT-2025-00001
GET /public/registrations/lookup?email=john@example.com
```

---

### 9.6 Guest Name Tag

```
GET /public/registrations/:registrationId/name-tag
```

---

### 9.7 Guest Participation Certificate

```
GET /public/registrations/:registrationId/certificate
```

---

### 9.8 Development Fee Contribution

```
POST /public/development-fees
```

**Body:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+255712345678",
  "amount": 100000,
  "currency": "TZS",
  "purpose": "Building Fund"
}
```

```
POST /public/development-fees/:feeId/pay
```

---

### 9.9 Verify Certificate

```
GET /public/certificates/verify/:code
```

Example: `GET /public/certificates/verify/IET-CERT-2025-0123`

---

## 10. Enums Reference

### Gender

| Value | Description |
|---|---|
| `MALE` | Male |
| `FEMALE` | Female |

### Title

| Value |
|---|
| `Eng.` |
| `Dr.` |
| `Prof.` |
| `Mr.` |
| `Ms.` |
| `Mrs.` |

### Engineering Discipline

> Note: Uses **title case**, not UPPER_CASE.

| Value |
|---|
| `Civil` |
| `Mechanical` |
| `Electrical` |
| `Electronics` |
| `Chemical` |
| `Mining` |
| `Agricultural` |
| `Environmental` |
| `Computer` |
| `Telecommunications` |
| `Petroleum` |
| `Biomedical` |
| `Industrial` |
| `Marine` |
| `Aeronautical` |
| `Other` |

### Application Type

| Value | Description |
|---|---|
| `NEW` | New application |
| `UPGRADING` | Upgrade existing membership |

### Registration Category

| Value | Description |
|---|---|
| `GRADUATE` | Graduate applicant |
| `STANDARD` | Standard applicant |

### Membership Class

| Value | Description |
|---|---|
| `GRADUATE` | Graduate Member |
| `ASSOCIATE` | Associate Member (AMIET) |
| `MIET` | Member (MIET) |
| `CORPORATE` | Corporate Member (CMIET) |
| `SENIOR` | Senior Member (SMIET) |
| `FELLOW` | Fellow (FIET) |
| `HONORARY` | Honorary Fellow |

### Application Status

| Value | Description |
|---|---|
| `DRAFT` | Application in progress |
| `SUBMITTED` | Submitted for review |
| `PENDING_REVIEW` | Under review |
| `APPROVED` | Approved |
| `REJECTED` | Rejected |
| `CHANGES_REQUESTED` | Changes required |

### Registration Step

| Value | Step |
|---|---|
| `PERSONAL_DETAILS` | Step 1 |
| `REGISTRATION_DETAILS` | Step 2 |
| `EDUCATION_EXPERIENCE` | Step 3 |
| `REFERENCES` | Step 4 |
| `EMAIL_VERIFICATION` | Step 5 |
| `PAYMENT` | Step 6 |
| `DECLARATION` | Step 7 |

### Event Category

| Value |
|---|
| `CPD_COURSE` |
| `CONFERENCE` |
| `WORKSHOP` |
| `SEMINAR` |
| `ONLINE_SEMINAR` |
| `AGM` |
| `NETWORKING` |

### Payment Method

| Value |
|---|
| `MPESA` |
| `AIRTEL_MONEY` |
| `TIGO_PESA` |
| `SELCOM` |
| `DPO_BANK` |

### Payment Type

| Value |
|---|
| `APPLICATION_FEE` |
| `MEMBERSHIP_FEE` |
| `EVENT_REGISTRATION` |
| `UPGRADE_FEE` |

### Document Type

| Value |
|---|
| `CV` |
| `CERTIFICATE` |
| `DEGREE` |
| `STATUTORY_BOARD` |
| `ADDITIONAL` |

### Reference Type

| Value |
|---|
| `PROPOSER` |
| `SUPPORTER` |

---

## 11. Error Handling

### Error Response Shape

```json
{
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2025-01-27T10:00:00.000Z",
  "path": "/api/v1/registrations",
  "data": null,
  "errors": [
    {
      "property": "email",
      "message": "email must be a valid email address",
      "constraints": ["isEmail"]
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Common Cause |
|---|---|---|
| `200` | OK | Request succeeded |
| `201` | Created | Resource created |
| `400` | Bad Request | Validation error or business rule violation |
| `401` | Unauthorized | Missing or invalid `Authorization` header |
| `403` | Forbidden | Valid token but insufficient permissions |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate resource (e.g. email already exists) |
| `429` | Too Many Requests | Rate limit exceeded (100 req/min) |
| `500` | Internal Server Error | Server-side error |

### Token Expiry Strategy

```
accessToken  → expires in ~1 hour → refresh using refreshToken
refreshToken → expires in ~7 days → redirect to login
```

**Recommended interceptor pattern:**

```typescript
// On 401 response:
// 1. Call POST /auth/refresh with stored refreshToken
// 2. Retry original request with new accessToken
// 3. If refresh also fails → clear tokens → redirect to login
```

---

## Quick Reference

| Action | Method | Path | Auth |
|---|---|---|---|
| Login | POST | `/auth/login` | No |
| Refresh Token | POST | `/auth/refresh` | No |
| Logout | POST | `/auth/logout` | Yes |
| Start Registration | POST | `/registrations` | No |
| Registration Details | PATCH | `/registrations/:id/steps/registration-details` | Yes |
| Add Education | POST | `/registrations/:id/education` | Yes |
| Add Experience | POST | `/registrations/:id/experience` | Yes |
| Upload Document | POST | `/registrations/:id/documents` | Yes |
| Add References | POST | `/registrations/:id/references` | Yes |
| Verify Email | POST | `/registrations/:id/verify-email` | Yes |
| Submit Application | POST | `/registrations/:id/submit` | Yes |
| My Profile | GET | `/users/profile` | Yes |
| Upload Photo | POST | `/users/profile/photo` | Yes |
| My Membership | GET | `/memberships/me` | Yes |
| Pay Membership Fee | POST | `/memberships/me/fees/pay` | Yes |
| List Events | GET | `/events` | No |
| Register for Event | POST | `/events/:id/register` | Yes |
| Initiate Payment | POST | `/payments` | Yes |
| Get Notifications | GET | `/notifications` | Yes |
| Public Calendar | GET | `/public/calendar` | No |
| Guest Event Reg. | POST | `/public/events/:id/register` | No |
