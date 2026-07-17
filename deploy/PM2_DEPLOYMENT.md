# PM2 Deployment (Production Droplet)

How the three IET apps are run in production, and the exact procedure used to
migrate them from **systemd** to **PM2**.

- **Server:** DigitalOcean droplet `139.59.139.30`
- **Project path:** `/var/www/iet`
- **Run-as user:** `iet` (nologin shell, home = `/var/www/iet`)
- **Node:** 20.x  ·  **PM2:** 7.x  ·  **PM2_HOME:** `/var/www/iet/.pm2`
- **Config:** `/var/www/iet/ecosystem.config.cjs` (tracked copy: `deploy/pm2/ecosystem.config.cjs`)

## Apps

| PM2 name             | App directory      | Port | Entry                                   |
| -------------------- | ------------------ | ---- | --------------------------------------- |
| `iet-api`            | `api`              | 3000 | `dist/main.js`                          |
| `iet-members-portal` | `engineer-portal`  | 4000 | `node_modules/@react-router/serve/bin.js ./build/server/index.js` |
| `iet-admin-portal`   | `admin-portal`     | 4100 | `node_modules/@react-router/serve/bin.js ./build/server/index.js` |

nginx reverse-proxies to `127.0.0.1:3000/4000/4100` (see `deploy/nginx/iet-portals.conf`).

## Running PM2 as the `iet` user

The `iet` account has a nologin shell, so wrap every PM2 command with `sudo -u`
**and** run it from a directory `iet` can access (otherwise PM2 fails with
`spawn EACCES` because it cannot traverse the caller's cwd):

```bash
cd /var/www/iet && sudo -u iet env HOME=/var/www/iet PM2_HOME=/var/www/iet/.pm2 pm2 <command>
```

For convenience the rest of this doc uses `PM2` to mean that full prefix.

## Environment / secrets

Each app's env is loaded at runtime via Node's `--env-file` (declared in
`node_args` in the ecosystem config), pointing at the app's own `.env`:

- `api/.env` — DB (host/port/user/password/name), JWT secrets, encryption key,
  SMTP, Beem SMS, DO Spaces, Selcom payments, admin bootstrap, etc.
- `engineer-portal/.env` — **requires `SESSION_SECRET` at runtime** (plus build-time `VITE_*`).
- `admin-portal/.env` — only build-time `VITE_*` vars.

Secrets are **never** committed. Templates live in `deploy/env/*.production.example`.

## Migration procedure (systemd -> PM2) — what was done

Performed 2026-07-17. Code was already at `origin/main` (commit `6886cc0`).

### 1. Install PM2 globally

```bash
npm install -g pm2      # installs /usr/bin/pm2
```

### 2. Back up existing builds (rollback safety)

```bash
cd /var/www/iet/api             && rm -rf dist.bak  && cp -r dist  dist.bak
cd /var/www/iet/engineer-portal && rm -rf build.bak && cp -r build build.bak
cd /var/www/iet/admin-portal    && rm -rf build.bak && cp -r build build.bak
```

### 3. Rebuild all three apps (as `iet`)

```bash
cd /var/www/iet/api             && sudo -u iet env HOME=/var/www/iet npm run build   # nest build
cd /var/www/iet/engineer-portal && sudo -u iet env HOME=/var/www/iet npm run build   # react-router build
cd /var/www/iet/admin-portal    && sudo -u iet env HOME=/var/www/iet npm run build   # react-router build
```

### 4. Add the ecosystem config

Copy `deploy/pm2/ecosystem.config.cjs` to `/var/www/iet/ecosystem.config.cjs`
(owned by `iet`). Validate syntax:

```bash
node -c /var/www/iet/ecosystem.config.cjs
```

### 5. Cutover — stop/disable systemd, start PM2

The old systemd unit files are **kept on disk**, only stopped and disabled
(reversible). This frees ports 3000/4000/4100 for PM2.

```bash
systemctl stop    iet-api.service iet-members-portal.service iet-admin-portal.service
systemctl disable iet-api.service iet-members-portal.service iet-admin-portal.service

cd /var/www/iet && PM2 start ecosystem.config.cjs
```

### 6. Persist across reboots

```bash
PM2 save                                                # writes /var/www/iet/.pm2/dump.pm2
pm2 startup systemd -u iet --hp /var/www/iet            # run as root; installs & enables pm2-iet.service
```

### 7. Verify

```bash
PM2 list                                                # all online, 0 restarts
ss -ltnp | grep -E ':(3000|4000|4100)'                  # listening
for p in 3000 4000 4100; do curl -s -o /dev/null -w "$p -> %{http_code}\n" http://127.0.0.1:$p/; done
# expected: 3000 -> 200 (api),  4000 -> 302,  4100 -> 302 (portals redirect to login)
systemctl is-enabled pm2-iet                            # enabled
```

## Redeploy after new code

```bash
cd /var/www/iet && git pull
# per changed app:
cd api             && sudo -u iet env HOME=/var/www/iet npm ci && sudo -u iet env HOME=/var/www/iet npm run build
cd engineer-portal && sudo -u iet env HOME=/var/www/iet npm ci && sudo -u iet env HOME=/var/www/iet npm run build
cd admin-portal    && sudo -u iet env HOME=/var/www/iet npm ci && sudo -u iet env HOME=/var/www/iet npm run build
# api schema changes:
cd /var/www/iet/api && sudo -u iet env HOME=/var/www/iet npm run migration:run

cd /var/www/iet && PM2 reload ecosystem.config.cjs      # zero/low-downtime restart
PM2 save
```

## Everyday commands

```bash
PM2 list                    # status
PM2 logs                    # tail all logs   (PM2 logs iet-api for one)
PM2 restart all             # hard restart
PM2 reload all              # graceful restart
PM2 monit                   # live dashboard
```

## Rollback to systemd

```bash
PM2 delete all
systemctl enable --now iet-api iet-members-portal iet-admin-portal
```

## Post-migration leftovers (kept intentionally, delete once confident)

- Build backups: `api/dist.bak`, `engineer-portal/build.bak`, `admin-portal/build.bak`
- Disabled (but present) systemd units in `/etc/systemd/system/` and `deploy/systemd/`

Remove build backups first once PM2 is proven; keep the systemd units until after
a successful test reboot (they are the rollback path).
