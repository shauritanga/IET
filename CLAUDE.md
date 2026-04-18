# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for the Institution of Engineers Tanzania (IET) — a membership management and events platform with three sub-applications:

- `api/` — NestJS 10 REST API (port 3000)
- `engineer-portal/` — React Router v7 member-facing frontend (port 4000)
- `admin-portal/` — React Router v7 admin-facing frontend (port 4100)

## Commands

### Backend API

```bash
cd api

# First-time setup
cp .env.example .env        # then set DB_PASSWORD to your local postgres password
npm run migration:run       # Apply migrations

# Development (requires local PostgreSQL on port 5432)
npm run start:dev           # Watch mode
npm run build && npm run start:prod

# Database
npm run migration:run       # Apply migrations
npm run migration:generate -- --name=MigrationName

# Tests
npm run test                # Unit tests
npm run test:watch
npm run test:cov
npm run test:e2e

# Code quality
npm run lint
npm run format
```

### Frontend Portals (same commands for both)

```bash
cd engineer-portal   # or admin-portal

npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # TypeScript check
```

## Architecture

### Backend (NestJS)

**Base URL:** `/api/v1`

Modules live in `src/app/modules/`. Each module follows the NestJS convention: `module.ts`, `controller.ts`, `service.ts`, DTOs, and entities.

Key modules:
- **auth** — JWT (15-min access / 7-day refresh), 2FA (TOTP), email verification, account lockout after 5 failed attempts
- **registration** — 7-step membership application flow; state machine via `step` PATCH endpoints
- **membership** — Categories, annual fees, renewals, upgrades
- **events** — Event creation, CPD points, certificates
- **payments** — M-Pesa, Selcom, Airtel Money, Tigo Pesa, DPO; webhook endpoints per gateway
- **admin** — Dashboard stats, member list, application review; restricted to `ADMIN`/`SUPER_ADMIN` roles
- **guest** — Public event registration, name tags, certificates (no auth required)
- **notifications** — Email, SMS, push with per-user preferences

Shared infrastructure:
- `src/common/` — Guards (`JwtAuthGuard`, `RolesGuard`), decorators, base DTOs, global exception filter
- `src/config/configuration.ts` — Typed environment config (validates on startup)
- `src/database/data-source.ts` — TypeORM config; PostgreSQL on `localhost:5432`

### Frontend Portals (React Router v7 + Vite)

Both portals share the same architecture:

- **Routing:** File-based via `remix-flat-routes` under `app/routes/`
- **Data fetching:** TanStack React Query + Axios; API client configured in `app/utils/` or `app/lib/`
- **State:** Zustand stores in `app/stores/`
- **Auth:** Context provider at `app/providers/auth-context.tsx`
- **UI (engineer-portal):** Radix UI primitives in `app/components/ui/`, domain components in `app/components/custom/`
- **Vite proxy:** `/api` → `localhost:3000`, so `VITE_API_BASE_URL=/api/v1`

### Node Version

Locked to **Node 20.x** (`.nvmrc` + `engines` field). Run `nvm use` before installing.
