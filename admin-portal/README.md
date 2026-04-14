# IET Admin Portal

## Local Development

Use Node 20 for local development:

```bash
nvm use
npm install
npm run dev
```

The local admin app runs on `http://localhost:4100`.

## Environment

Copy `.env.example` to `.env` if needed:

```bash
VITE_API_BASE_URL=http://127.0.0.1:3000/api/v1
```

## Notes

- This app is intended for `ADMIN` and `SUPER_ADMIN` users only.
- It uses the same backend auth contract as the engineer portal, but with separate routes, auth UI, and dashboard.
