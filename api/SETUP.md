# IET Core API - Setup Guide

This guide covers the supported ways to run the IET Core API locally.

## Prerequisites

- Docker Desktop or Docker Engine with Compose
- Node.js 20.x and npm 10.x only if you need native-host execution

## Setup Steps

### 1. Prepare Environment File

```bash
cp .env.example .env
```

The checked-in `.env.example` is pre-populated with safe development defaults for:
- API on `http://localhost:3000`
- Postgres on `localhost:5435`
- JWT secrets for local dev
- Swagger enabled

### 2. Run the Supported Docker Development Stack

```bash
npm run docker:dev
```

This starts:
- Postgres in Docker on `localhost:5435`
- The NestJS API on `localhost:3000`
- Swagger on `http://localhost:3000/api/docs`

### 3. Verify the API

Wait for the containers to become healthy, then verify:

```bash
curl http://localhost:3000/health
```

Expected response shape:

```json
{"status":"ok","timestamp":"..."}
```

### 4. Stop the Stack

```bash
npm run docker:dev:down
```

## Native-Host Development

Use this only when Docker is not appropriate.

### 1. Switch to the supported Node version

```bash
nvm use
```

This repository now pins Node 20 in `.nvmrc`. Running on newer major versions such as Node 25 is not a supported path.

### 2. Install dependencies and start the API

```bash
npm install
npm run start:dev
```

The native-host path still expects PostgreSQL to be available using the values in `.env`.

## API Documentation

When the API is running, Swagger is available at:
```
http://localhost:3000/api/docs
```

## Troubleshooting

### Database Connection Issues

- If you are using Docker dev, confirm `docker compose` is running both `db` and `api`
- Verify `.env` still has matching `DB_*` values
- For native-host runs, make sure PostgreSQL is reachable on the port in `.env`

### Authentication Issues

- Check that JWT secrets are properly set in the `.env` file
- Verify user credentials when making API calls

## Additional Commands

- **Run tests**: `npm run test`
- **Run e2e tests**: `npm run test:e2e`
- **Generate migrations**: `npm run migration:generate -- -n MigrationName`
- **Revert migrations**: `npm run migration:revert` 
