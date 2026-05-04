# IET Tanzania — DigitalOcean Deployment Guide

## Overview

```
Internet
  │
  ├── https://member-portal.iet.or.tz  ──► Nginx :443 ──► localhost:4000  (Member Portal — React)
  ├── https://admin-portal.iet.or.tz   ──► Nginx :443 ──► localhost:4100  (Admin Portal  — React)
  └── https://api.iet.or.tz            ──► Nginx :443 ──► localhost:3000  (NestJS API)
                                                          │
                                                   PostgreSQL :5432
                                                   (internal only)

Droplet IP: 67.205.135.70
DNS provider: SuperCP (ns1-4.supercp.com)
```

---

## Prerequisites

SSH into the droplet and install the following if not already present:

```bash
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2
npm install -g pm2

# Serve (static file server)
npm install -g serve

# Nginx
sudo apt install -y nginx

# Certbot
sudo apt install -y certbot python3-certbot-nginx

# PostgreSQL (if not already running)
sudo apt install -y postgresql postgresql-contrib
```

---

## Step 1 — DNS Records (SuperCP / cPanel)

> The DNS for `iet.or.tz` is managed at **SuperCP** (`ns1-4.supercp.com`).
> The existing `iet.or.tz` website is **not affected** — only new subdomains are added.

1. Log in to your SuperCP / cPanel control panel
2. Go to **Zone Editor** → select `iet.or.tz` → **Manage**
3. Add three **A records**:

| Type | Name              | Address        | TTL   |
|------|-------------------|----------------|-------|
| A    | `member-portal.iet.or.tz` | `67.205.135.70` | 14400 |
| A    | `admin-portal.iet.or.tz`  | `67.205.135.70` | 14400 |
| A    | `api.iet.or.tz`           | `67.205.135.70` | 14400 |

4. Save all records and wait 10–30 minutes for propagation

**Verify:**
```bash
dig member-portal.iet.or.tz +short   # should return 67.205.135.70
dig admin-portal.iet.or.tz +short
dig api.iet.or.tz +short
```

---

## Step 2 — Firewall (UFW)

Allow only SSH and web traffic. Block raw service ports so everything goes through Nginx.

```bash
ufw allow 22      # SSH
ufw allow 80      # HTTP (Nginx, redirects to HTTPS)
ufw allow 443     # HTTPS (Nginx)
ufw deny 3000     # API — internal only
ufw deny 4000     # Member portal — internal only
ufw deny 4100     # Admin portal — internal only
ufw enable
ufw status
```

---

## Step 3 — API `.env` (Production)

On the server, edit `/path/to/api/.env` and update these values:

```env
NODE_ENV=production
PORT=3000

APP_URL=https://api.iet.or.tz
ENGINEER_PORTAL_URL=https://member-portal.iet.or.tz
ADMIN_PORTAL_URL=https://admin-portal.iet.or.tz

FRONTEND_ORIGINS=https://member-portal.iet.or.tz,https://admin-portal.iet.or.tz

# Database — use strong production credentials
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=iet
DB_PASSWORD=<strong-password>
DB_NAME=iet_db

# JWT — generate strong random secrets for production
JWT_SECRET=<random-64-char-string>
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=<random-64-char-string>
JWT_REFRESH_EXPIRATION=7d

# Swagger — disable in production
SWAGGER_ENABLED=false
```

> **Generate strong secrets:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

> ⚠️ Never commit `.env` to git. Ensure `.env` is in `.gitignore`.

---

## Step 4 — Frontend `.env` Files (Production)

Both portals must point to the production API URL. On the server:

**`engineer-portal/.env`**
```env
VITE_API_BASE_URL=https://api.iet.or.tz/api/v1
```

**`admin-portal/.env`**
```env
VITE_API_BASE_URL=https://api.iet.or.tz/api/v1
```

---

## Step 5 — Build the Frontends

```bash
cd /path/to/engineer-portal
npm install
npm run build

cd /path/to/admin-portal
npm install
npm run build
```

Built output lands in `build/client/` inside each portal directory.

---

## Step 6 — PM2 Process Management

Start all three services and configure them to restart on reboot:

```bash
# API
cd /path/to/api
npm install
npm run build
pm2 start npm --name "iet-api" -- run start:prod

# Member portal (static built files)
pm2 start serve --name "iet-member" -- -s /path/to/engineer-portal/build/client -p 4000

# Admin portal (static built files)
pm2 start serve --name "iet-admin" -- -s /path/to/admin-portal/build/client -p 4100

# Save and enable autostart on reboot
pm2 save
pm2 startup
# ↑ Copy and run the command it prints
```

**Useful PM2 commands:**
```bash
pm2 list                    # view all processes
pm2 logs iet-api            # stream API logs
pm2 restart iet-api         # restart a service
pm2 reload iet-api          # zero-downtime reload
```

---

## Step 7 — Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/iet
```

Paste:

```nginx
# ── Member Portal ─────────────────────────────────────────────
server {
    listen 80;
    server_name member-portal.iet.or.tz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name member-portal.iet.or.tz;

    ssl_certificate     /etc/letsencrypt/live/member-portal.iet.or.tz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/member-portal.iet.or.tz/privkey.pem;

    location / {
        proxy_pass         http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }
}

# ── Admin Portal ───────────────────────────────────────────────
server {
    listen 80;
    server_name admin-portal.iet.or.tz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name admin-portal.iet.or.tz;

    ssl_certificate     /etc/letsencrypt/live/admin-portal.iet.or.tz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin-portal.iet.or.tz/privkey.pem;

    location / {
        proxy_pass         http://localhost:4100;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }
}

# ── API ────────────────────────────────────────────────────────
server {
    listen 80;
    server_name api.iet.or.tz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.iet.or.tz;

    ssl_certificate     /etc/letsencrypt/live/api.iet.or.tz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.iet.or.tz/privkey.pem;

    # Uploaded files
    location /uploads/ {
        proxy_pass http://localhost:3000;
    }

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/iet /etc/nginx/sites-enabled/
sudo nginx -t          # must say "syntax is ok"
sudo systemctl reload nginx
```

---

## Step 8 — SSL Certificates (Let's Encrypt)

> Run this **after** DNS has propagated and Nginx is active on port 80.

```bash
sudo certbot --nginx \
  -d member-portal.iet.or.tz \
  -d admin-portal.iet.or.tz \
  -d api.iet.or.tz
```

Certbot will:
- Obtain free certificates from Let's Encrypt
- Automatically update the Nginx config with SSL paths
- Set up auto-renewal (runs twice daily via systemd timer)

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

---

## Step 9 — Resend Email (when domain is verified)

1. Sign up at [resend.com](https://resend.com)
2. Go to **Domains** → Add `iet.or.tz`
3. Resend provides DNS records — add them in SuperCP / cPanel:
   - **TXT** record for SPF
   - **TXT** record for DKIM
   - **TXT** record for DMARC (optional but recommended)
4. Click **Verify** in Resend dashboard
5. Update `api/.env` on the server:

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxxxxxxxxxx    # your Resend API key
EMAIL_FROM=noreply@iet.or.tz
EMAIL_FROM_NAME=IET Tanzania
```

6. Restart the API:
```bash
pm2 restart iet-api
```

> Password reset emails will now send from `noreply@iet.or.tz` with proper SPF/DKIM authentication, avoiding spam folders.

---

## Step 10 — Verification Checklist

Run these after the full setup to confirm everything is working:

```bash
# DNS resolves correctly
dig member-portal.iet.or.tz +short    # → 67.205.135.70
dig admin-portal.iet.or.tz +short     # → 67.205.135.70
dig api.iet.or.tz +short              # → 67.205.135.70

# HTTPS responds (certificates valid)
curl -I https://api.iet.or.tz/health
curl -I https://member-portal.iet.or.tz
curl -I https://admin-portal.iet.or.tz

# API health check
curl https://api.iet.or.tz/health

# PM2 all processes running
pm2 list

# Nginx no errors
sudo nginx -t
sudo systemctl status nginx

# Certbot auto-renewal works
sudo certbot renew --dry-run
```

**Expected results:**
- All `curl -I` commands return `HTTP/2 200`
- `pm2 list` shows `iet-api`, `iet-member`, `iet-admin` all `online`
- `nginx -t` says `syntax is ok`
- Certbot dry-run says `Congratulations, all simulated renewals succeeded`

---

## Redeployment (updating the app)

When you push new code:

```bash
cd /path/to/api
git pull
npm install
npm run build
pm2 restart iet-api

cd /path/to/engineer-portal
git pull
npm install
npm run build
pm2 restart iet-member

cd /path/to/admin-portal
git pull
npm install
npm run build
pm2 restart iet-admin
```
