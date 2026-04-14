# IET Management System - Core API

A comprehensive, production-ready backend API for the Institution of Engineers Tanzania (IET) platform. Built with NestJS, TypeORM, and PostgreSQL.

## Features

- **Authentication & Authorization**
  - JWT authentication with refresh tokens
  - Email verification
  - Password reset flow
  - Two-factor authentication (2FA)
  - Role-based access control (RBAC)
  - Account lockout after failed attempts

- **Member Registration**
  - Multi-step registration flow (7 steps)
  - Personal details, education, experience tracking
  - Reference verification
  - Document uploads
  - Payment integration for application fees

- **Membership Management**
  - Membership ID generation (IET/ENG/XXXX format)
  - Multiple membership classes (Graduate, Member, Fellow, etc.)
  - Annual fee tracking and reminders
  - Membership status management

- **Events & Training**
  - Event creation and management
  - CPD courses, conferences, workshops
  - Event registration with payment
  - Certificate generation
  - CPD points tracking

- **Payment Integration**
  - M-Pesa STK Push
  - Airtel Money
  - Tigo Pesa
  - Selcom (card payments)
  - DPO (bank transfers)
  - Payment webhooks

- **Notifications**
  - Email notifications
  - SMS notifications
  - Push notifications
  - Notification preferences

- **Admin Dashboard**
  - Member statistics
  - Application review workflow
  - Payment analytics
  - Member management
  - Export functionality

- **Guest/Public Access**
  - Public events calendar
  - Guest event registration (no membership required)
  - Control number payment system
  - Name tag generation
  - Participation certificate download with IET signature
  - Development fee contributions
  - System usage instructions

## Tech Stack

- **Framework:** NestJS 10.x
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT (Passport.js)
- **Validation:** class-validator
- **Documentation:** Swagger/OpenAPI
- **Rate Limiting:** @nestjs/throttler

## Getting Started

### Prerequisites

- Docker Desktop or Docker Engine with Compose
- Node.js 20.x only if you want to run the API directly on the host
- npm 10.x for native-host runs

### Recommended Local Development

The supported local workflow is Docker-based and runs the API with PostgreSQL.

```bash
cp .env.example .env
npm run docker:dev
```

The development stack exposes:
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- Health: `http://localhost:3000/health`
- PostgreSQL: `localhost:5435`
- Engineer portal: `http://localhost:4000`
- Admin portal: `http://localhost:4100`

To stop the stack:

```bash
npm run docker:dev:down
```

### Native-Host Development

Use this only if you need to run NestJS directly on the host.

```bash
nvm use
npm install
cp .env.example .env
npm run start:dev
```

### Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
FRONTEND_ORIGINS=http://localhost:4000,http://127.0.0.1:4000,http://localhost:4100,http://127.0.0.1:4100

# Database
DATABASE_ENABLED=true
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=iet_platform

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRATION=7d

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Payment Gateways (optional)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=

SELCOM_API_KEY=
SELCOM_API_SECRET=
SELCOM_VENDOR_ID=
```

### Running the Application

```bash
# Docker development
npm run docker:dev

# Native host development
npm run start:dev

# Production
npm run build
npm run start:prod

# Run migrations
npm run migration:run
```

### API Documentation

Once the application is running, visit:
- **Swagger UI:** http://localhost:3000/api/docs

### Notes

- Local development assumes a PostgreSQL-backed API. The repository's old "no database" setup notes are not the supported path for this project.
- If you run natively, use Node 20.x. The current host `Node 25` line is outside the supported range for this repository.
- CORS is restricted to the configured engineer/admin portal origins. Override `FRONTEND_ORIGINS` if your local or deployed frontend URLs differ.

## API Endpoints Overview

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/verify-email` | Verify email with code |
| POST | `/resend-verification` | Resend verification code |
| POST | `/login` | User login |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout user |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password |
| POST | `/change-password` | Change password |
| POST | `/2fa/enable` | Enable 2FA |
| POST | `/2fa/validate` | Validate 2FA token |
| POST | `/2fa/disable` | Disable 2FA |

### Users (`/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update profile |
| POST | `/me/photo` | Upload profile photo |

### Registrations (`/api/v1/registrations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create registration (Step 1) |
| PATCH | `/:id/steps/registration-details` | Update registration details (Step 2) |
| POST | `/:id/education` | Add education |
| POST | `/:id/experience` | Add experience |
| POST | `/:id/references` | Add references (Step 4) |
| POST | `/:id/verify-email` | Verify email (Step 5) |
| POST | `/:id/submit` | Submit application (Step 7) |
| GET | `/:id` | Get registration details |
| GET | `/` | Get user registrations |

### Memberships (`/api/v1/memberships`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get membership details |
| GET | `/me/fees` | Get fee history |
| POST | `/me/fees/pay` | Initiate fee payment |
| GET | `/me/fees/:year/receipt` | Get payment receipt |

### Events (`/api/v1/events`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List events |
| GET | `/:id` | Get event details |
| POST | `/:id/register` | Register for event |
| GET | `/registrations/me` | Get my registrations |
| POST | `/registrations/:id/cancel` | Cancel registration |
| GET | `/registrations/:id/certificate` | Get certificate |

### Payments (`/api/v1/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Initiate payment |
| GET | `/me` | Get payment history |
| GET | `/:id` | Get payment details |
| POST | `/webhooks/mpesa` | M-Pesa callback |
| POST | `/webhooks/selcom` | Selcom callback |

### Notifications (`/api/v1/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get notifications |
| PATCH | `/:id/read` | Mark as read |
| POST | `/mark-all-read` | Mark all as read |
| GET | `/preferences` | Get preferences |
| PATCH | `/preferences` | Update preferences |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Get dashboard statistics |
| GET | `/members` | List all members |
| GET | `/members/:id` | Get member details |
| PATCH | `/members/:id/status` | Update member status |
| GET | `/members/export` | Export members CSV |
| GET | `/applications` | List applications |
| PATCH | `/applications/:id/review` | Review application |
| GET | `/analytics/members` | Get analytics |
| POST | `/events/check-in` | Check-in guest/member at event |

### Guest/Public (`/api/v1/public`) - No Authentication Required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendar` | Get public events calendar |
| GET | `/instructions` | Get system usage instructions |
| POST | `/events/:eventId/register` | Register as guest for event |
| POST | `/registrations/:id/pay` | Initiate guest payment |
| GET | `/registrations/lookup` | Lookup by ticket/email |
| GET | `/registrations/:id/name-tag` | Generate name tag |
| GET | `/registrations/:id/certificate` | Download certificate |
| POST | `/development-fees` | Create development fee contribution |
| POST | `/development-fees/:id/pay` | Pay development fee |
| GET | `/certificates/verify/:code` | Verify certificate authenticity |

## Project Structure

```
src/
├── config/              # Configuration files
├── database/            # Migrations and data source
├── app/
│   ├── common/          # Shared utilities
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── enums/
│   │   ├── exception/
│   │   └── services/
│   └── modules/
│       ├── auth/        # Authentication
│       ├── user/        # User management
│       ├── registration/# Member registration
│       ├── membership/  # Membership & fees
│       ├── events/      # Events & training
│       ├── payments/    # Payment processing
│       ├── notifications/# Notifications
│       ├── admin/       # Admin dashboard
│       └── shared/      # Shared services
└── main.ts
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration

# Test coverage
npm run test:cov
```

## Database Migrations

```bash
# Generate migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token expiration (15 min access, 7 days refresh)
- Account lockout after 5 failed login attempts (30 min)
- Rate limiting (100 requests per minute)
- CORS configuration
- Input validation on all endpoints
- SQL injection prevention via TypeORM
- XSS prevention

## License

This project is licensed under the MIT License.
