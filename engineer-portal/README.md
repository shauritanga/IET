# IET Engineer Portal

## Local Development

Use Node 20 for native-host development:

```bash
nvm use
npm install
npm run dev
```

The local engineer portal runs on `http://localhost:4000`.

## Environment

Copy `.env.example` to `.env` if you need to recreate local configuration. The checked-in example is already aligned with the local backend:

```bash
VITE_API_BASE_URL=http://127.0.0.1:3000/api/v1
SESSION_SECRET=dev_session_secret_for_local_frontend
```

## Notes

- The supported local API target is the backend running on `http://127.0.0.1:3000`.
- This app is the engineer/member-facing portal. The admin-facing portal now lives in the sibling `admin-portal` app.
- This repo is pinned to Node 20.x for local development.
