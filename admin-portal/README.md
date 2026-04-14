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
VITE_API_BASE_URL=/api/v1
```

For LAN testing, start the app with `npm run dev` and open `http://YOUR-LAN-IP:4100` from another device on the same network. The Vite dev server proxies `/api` to the local backend automatically.

## Notes

- This app is intended for `ADMIN` and `SUPER_ADMIN` users only.
- It uses the same backend auth contract as the engineer portal, but with separate routes, auth UI, and dashboard.
