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
VITE_API_BASE_URL=/api/v1
SESSION_SECRET=dev_session_secret_for_local_frontend
```

## Notes

- For LAN testing, start the app with `npm run dev` and open `http://YOUR-LAN-IP:4000` from another device on the same network. The Vite dev server proxies `/api` to the local backend automatically.
- This app is the engineer/member-facing portal. The admin-facing portal now lives in the sibling `admin-portal` app.
- This repo is pinned to Node 20.x for local development.
