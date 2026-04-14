# IET Management System — 7-Day Delivery Plan

**Prepared for:** IET Tanzania Management & Stakeholders
**Purpose:** This document outlines what will be built, why it matters, and what the system will be capable of doing by the end of each day.

---

## Where We Stand Today

The foundation of the IET Management System is already built and working. Below is a summary of what is ready and what still needs to be completed.

| Area | Status | What It Means |
|------|--------|---------------|
| Member Login & Security | Ready (95%) | Members can log in, reset passwords, and use two-step verification |
| Member Profiles | Ready (90%) | Members can manage their profiles, photos, and membership ID |
| Membership Application Process | Ready (85%) | The 7-step online application with document uploads and email notifications works |
| Email Notifications | Ready (90%) | The system sends real emails through IET's official email address |
| File & Document Storage | Ready (90%) | Documents uploaded by applicants are securely stored in the cloud |
| Membership Management | Partially Ready (50%) | Membership fees and categories are defined; renewal and upgrade features not yet done |
| Online Payments | Not Yet Ready (30%) | Currently uses test/dummy payments — no real money can be processed yet |
| Alerts & Notifications | Partially Ready (40%) | Basic notifications work; SMS and automatic reminders not yet done |
| Admin Control Panel | Partially Ready (30%) | Admin area exists but lacks full reports and application review tools |
| Events Management | Early Stage (20%) | Basic structure is in place; full functionality not yet built |
| Guest Registration | Early Stage (10%) | Not yet built — guests cannot register for events yet |

---

## The 7-Day Plan

---

### Day 1 — Strengthen the Foundation & Complete Membership Management

**Business Goal:** Ensure the system is stable, secure, and ready to grow — and give members the ability to renew or upgrade their memberships online.

**What Will Be Delivered:**

**Database Stability**
The system currently updates its database automatically as developers make changes, which works during development but is risky in a live environment. We will switch to a controlled, step-by-step database update process — similar to how banks manage their core systems — so that no data is ever accidentally lost or changed.

**Membership Self-Service**
Members will be able to:
- View their full membership details and payment history
- See how much they owe in annual membership fees
- Submit a request to renew their membership online
- Submit a request to upgrade their membership category (e.g., from Graduate to MIET)

Payments for renewals and upgrades will be linked to the payment system built on Day 2.

**Business Value:** Members no longer need to visit the office or call to renew. This reduces administrative workload and improves member satisfaction.

---

### Day 2 — Enable Real Online Payments

**Business Goal:** Allow IET to collect actual payments for membership fees, application fees, and events through trusted mobile money and card payment channels.

**What Will Be Delivered:**

**M-Pesa Integration (Vodacom Tanzania)**
Members will be able to pay using M-Pesa. They will receive a payment prompt on their phone, confirm the amount, and the system will automatically record the payment and update their account within seconds.

**Selcom Integration (Card & Mobile Money Aggregator)**
Members who prefer to pay by card or through other mobile money providers (e.g., Airtel, Tigo) can do so via Selcom — a trusted Tanzanian payment processor.

**Automatic Payment Confirmation**
Once a payment is confirmed by the bank or mobile network, the system will automatically:
- Record the transaction
- Mark the relevant step in the application as paid
- Notify the member by email or SMS

**Payment History & Receipts**
Members and admins will be able to view a full record of all transactions and download official payment receipts.

**Business Value:** IET can collect fees 24/7 without manual bank reconciliation. Payments are verified in real time, reducing fraud risk and eliminating delays caused by manual payment confirmation.

---

### Day 3 — Build the Full Events Management System

**Business Goal:** Allow IET to create, publish, and manage events online — and allow members to register and attend events through the system.

**What Will Be Delivered:**

**Event Creation & Publishing (Admin)**
Administrators will be able to:
- Create events with full details (title, description, date, location, speakers, agenda, fees)
- Set a maximum number of participants
- Publish events to make them visible to members
- Take events offline when needed

**Member Event Registration**
Members will be able to:
- Browse all upcoming events
- Register for events and pay online if there is a registration fee
- Cancel their registration if plans change
- View all events they have registered for

**Attendance Tracking**
On the day of the event, staff can check in attendees using the system — marking who actually showed up. This creates an accurate attendance record for each event.

**Event Reports**
Administrators will be able to see how many people registered, how many attended, and how much revenue was collected for each event.

**Business Value:** Events are managed end-to-end without spreadsheets or manual tracking. IET has a complete record of every event and every attendee.

---

### Day 4 — Guest Registration & Admin Control Panel

**Business Goal:** Allow non-members to attend events, and give IET management the tools to review applications, approve memberships, and monitor the organisation's performance.

**What Will Be Delivered:**

**Guest Event Registration**
People who are not IET members will be able to:
- Register for events as guests using their name and contact details
- Receive a unique ticket number by email
- Be checked in at the event using that ticket number

**Admin Dashboard — Organisational Overview**
Management will be able to log in to an admin panel and see a real-time overview of:
- Total number of members (and how many are active)
- Number of pending membership applications
- Revenue collected this month
- Upcoming events and registrations
- How many new members joined this week

**Membership Application Review**
The admin team will be able to:
- View all pending membership applications in one place
- Review each applicant's documents and profile
- Approve an application — which automatically assigns a membership number and sends an approval email to the applicant
- Reject an application with a reason — which notifies the applicant
- Request additional information from the applicant

**Member Management**
Admins will be able to search and filter the full member list, view any member's complete history, and update a member's status if needed.

**Business Value:** Management has full visibility into the organisation's membership, applications, and finances — all in one place, without needing multiple spreadsheets or manual processes.

---

### Day 5 — Automatic Alerts, Reminders & Communication

**Business Goal:** Ensure members and staff are always informed through timely, automatic communications — reducing the need for manual follow-up.

**What Will Be Delivered:**

**Membership Expiry Reminders**
The system will automatically send reminders to members:
- 30 days before their membership expires
- 7 days before expiry
- 1 day before expiry
- On the day of expiry

This reduces the number of members who accidentally let their membership lapse.

**Event Reminders**
Members who have registered for an event will automatically receive a reminder the day before the event.

**Payment Confirmations**
When a payment is received, the member is automatically notified with a summary and receipt.

**Application Status Updates**
Applicants are automatically notified when their application is approved, rejected, or when additional information is requested.

**Notification Preferences**
Members can choose how they want to be notified — by email, SMS, or in-app notification — based on their personal preference.

**Business Value:** The system handles routine communication automatically, freeing up staff to focus on higher-value tasks. Members feel informed and valued, which improves retention.

---

### Day 6 — Security Review & Quality Assurance

**Business Goal:** Ensure the system is secure, reliable, and behaves correctly in all situations before it goes live.

**What Will Be Delivered:**

**Security Hardening**
The development team will review and strengthen all access controls — making sure only the right people can access sensitive information. This includes:
- Verifying that members can only see their own data
- Protecting the system against common online threats
- Adding additional layers of security on login and payment endpoints

**Full System Testing**
Every critical process will be tested end-to-end to confirm it works correctly:
- The full membership application journey from start to approval
- Payment processing and confirmation
- Admin review and approval workflow
- Event registration and check-in
- All email and notification flows

**API Documentation**
A complete reference guide will be produced for the technical teams and any third-party developers who will connect their systems to the IET platform.

**Business Value:** Confidence that the system is safe, correct, and ready for real users. Reducing the risk of errors, data breaches, or system downtime after launch.

---

### Day 7 — Production Launch Preparation

**Business Goal:** Prepare the system for live deployment — so it is stable, professional, and ready for real members to use.

**What Will Be Delivered:**

**Live Environment Setup**
The system will be configured for the production environment (api.iet.or.tz) with:
- Secure encrypted connections (HTTPS)
- Real payment credentials connected (M-Pesa & Selcom)
- Production email sending through IET's official email
- Secure document storage on DigitalOcean

**System Infrastructure**
The technical infrastructure will be finalised so the system:
- Starts up automatically if the server restarts
- Handles traffic efficiently without slowing down
- Has a health monitoring endpoint that can be used for uptime alerts

**Final End-to-End Test on Live Environment**
Before opening to members, the team will run through the complete registration flow, a real payment, an admin approval, and an event registration — all on the live system — to confirm everything works.

**Monitoring & Logging**
The system will record activity logs so the development team can quickly identify and fix any issues that arise after launch.

**Business Value:** The system goes live in a controlled, tested, and monitored way — minimising the risk of problems affecting real users on launch day.

---

## Delivery Overview

| Day | Focus Area | Key Business Outcome |
|-----|-----------|---------------------|
| Day 1 | Foundation & Membership Management | Members can renew and upgrade online |
| Day 2 | Online Payments | IET collects real payments via M-Pesa & Selcom |
| Day 3 | Events Management | Full event lifecycle managed in the system |
| Day 4 | Guest Access & Admin Dashboard | Guests can attend events; management has full visibility |
| Day 5 | Automated Communications | Members receive timely alerts without manual effort |
| Day 6 | Security & Testing | System is verified safe and correct |
| Day 7 | Launch Preparation | System goes live with confidence |

---

## How Each Day Depends on the Others

The work is sequenced deliberately so that each day builds on what came before:

- **Day 1** must come first — a stable foundation and membership data is needed by all other features.
- **Day 2** (Payments) depends on Day 1 — membership renewal fees must be defined before payment can be linked.
- **Day 3** (Events) depends on Day 1 — event registrations link to member records.
- **Day 4** (Guest & Admin) depends on Days 2 and 3 — the admin dashboard shows payment revenue and event data.
- **Day 5** (Notifications) depends on Days 1–4 — alerts are triggered by payments, events, and applications.
- **Day 6** (Testing) can only happen once all features are built.
- **Day 7** (Launch) is the final step — everything comes together here.

---

## What We Need from the IET Team

To complete this plan on time, the following will be needed:

| Requirement | When Needed |
|-------------|-------------|
| M-Pesa Tanzania business account credentials | Before Day 2 |
| Selcom merchant account credentials | Before Day 2 |
| Confirmation of the production server details | Before Day 7 |
| A nominated staff member to test the admin approval workflow | Day 4–6 |
| Decision on which event to use for the first live test | Day 7 |

---

*This plan covers the core system features. Additional capabilities such as CPD tracking, reports generation, and a public-facing website can be planned as Phase 2 once the core system is live.*
