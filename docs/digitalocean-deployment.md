# DigitalOcean Droplet Deployment

This deployment runs the IET system on one Ubuntu droplet:

- `members-portal.iet.or.tz` -> React Router members portal on local port `4000`
- `admin-portal.iet.or.tz` -> React Router admin portal on local port `4100`
- `api.iet.or.tz` -> NestJS API on local port `3000`
- The portal production env files point directly to `https://api.iet.or.tz/api/v1`
- `/api/*` on both portal domains is still proxied to the API for compatibility
- PostgreSQL runs on the droplet on port `5432`

## 1. DNS

Create three `A` records pointing to the droplet public IP:

```text
api.iet.or.tz             A    <droplet-ip>
admin-portal.iet.or.tz    A    <droplet-ip>
members-portal.iet.or.tz  A    <droplet-ip>
```

## 2. Server Packages

Use Ubuntu 22.04 or 24.04.

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib git ufw certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g npm@10
```

Create an application user:

```bash
sudo adduser --system --group --home /var/www/iet iet
sudo mkdir -p /var/www/iet
sudo chown -R iet:iet /var/www/iet
```

## 3. PostgreSQL

Create the production database and user:

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE iet_db;
CREATE USER iet_user WITH ENCRYPTED PASSWORD 'change_me';
GRANT ALL PRIVILEGES ON DATABASE iet_db TO iet_user;
\c iet_db
GRANT ALL ON SCHEMA public TO iet_user;
\q
```

Use a strong password and copy it into `api/.env`.

## 4. Upload Code

Clone or upload the repo to `/var/www/iet`:

```bash
sudo -u iet git clone <repo-url> /var/www/iet
```

If you upload files manually, ensure ownership is correct:

```bash
sudo chown -R iet:iet /var/www/iet
```

## 5. Environment Files

Create production env files from the templates in this repo:

```bash
sudo -u iet cp /var/www/iet/deploy/env/api.production.example /var/www/iet/api/.env
sudo -u iet cp /var/www/iet/deploy/env/admin-portal.production.example /var/www/iet/admin-portal/.env
sudo -u iet cp /var/www/iet/deploy/env/engineer-portal.production.example /var/www/iet/engineer-portal/.env
```

Edit secrets and credentials:

```bash
sudo -u iet nano /var/www/iet/api/.env
sudo -u iet nano /var/www/iet/admin-portal/.env
sudo -u iet nano /var/www/iet/engineer-portal/.env
```

Required API values to change before production:

- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY`
- SMTP credentials
- payment gateway credentials, if enabled
- DigitalOcean Spaces credentials, if uploads should use Spaces

## 6. Install, Build, Migrate

```bash
sudo -u iet bash -lc 'cd /var/www/iet/api && npm ci && npm run build && npm run migration:run'
sudo -u iet bash -lc 'cd /var/www/iet/engineer-portal && npm ci && npm run build'
sudo -u iet bash -lc 'cd /var/www/iet/admin-portal && npm ci && npm run build'
```

## 7. systemd Services

Install the service files:

```bash
sudo cp /var/www/iet/deploy/systemd/iet-api.service /etc/systemd/system/iet-api.service
sudo cp /var/www/iet/deploy/systemd/iet-members-portal.service /etc/systemd/system/iet-members-portal.service
sudo cp /var/www/iet/deploy/systemd/iet-admin-portal.service /etc/systemd/system/iet-admin-portal.service
sudo systemctl daemon-reload
sudo systemctl enable --now iet-api iet-members-portal iet-admin-portal
```

Check status and logs:

```bash
sudo systemctl status iet-api iet-members-portal iet-admin-portal
sudo journalctl -u iet-api -f
```

## 8. Nginx

Install the Nginx config:

```bash
sudo cp /var/www/iet/deploy/nginx/iet-portals.conf /etc/nginx/sites-available/iet-portals
sudo ln -s /etc/nginx/sites-available/iet-portals /etc/nginx/sites-enabled/iet-portals
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 9. HTTPS

After DNS points to the droplet, issue certificates:

```bash
sudo certbot --nginx -d api.iet.or.tz -d members-portal.iet.or.tz -d admin-portal.iet.or.tz
```

Certbot will update the Nginx config for HTTPS and redirects.

## 10. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Do not expose ports `3000`, `4000`, `4100`, or `5432` publicly. They should only be reachable locally on the droplet.

## 11. Smoke Tests

From your machine:

```bash
curl -I https://members-portal.iet.or.tz
curl -I https://admin-portal.iet.or.tz
curl https://api.iet.or.tz/health
curl https://members-portal.iet.or.tz/health
```

On the droplet:

```bash
curl http://127.0.0.1:3000/health
curl -I http://127.0.0.1:4000
curl -I http://127.0.0.1:4100
```

## 12. Updating Production

```bash
sudo -u iet bash -lc 'cd /var/www/iet && git pull'
sudo -u iet bash -lc 'cd /var/www/iet/api && npm ci && npm run build && npm run migration:run'
sudo -u iet bash -lc 'cd /var/www/iet/engineer-portal && npm ci && npm run build'
sudo -u iet bash -lc 'cd /var/www/iet/admin-portal && npm ci && npm run build'
sudo systemctl restart iet-api iet-members-portal iet-admin-portal
```
