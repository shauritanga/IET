# Host All Three IET Apps on One DigitalOcean Droplet

This guide deploys these three apps on a single Ubuntu DigitalOcean droplet:

- `api` on internal port `3000`
- `engineer-portal` on internal port `4000`
- `admin-portal` on internal port `4100`

Recommended public URLs:

- `https://api.yourdomain.com` -> NestJS API
- `https://engineer.yourdomain.com` -> engineer portal
- `https://admin.yourdomain.com` -> admin portal

This setup uses:

- Ubuntu 24.04 LTS droplet
- Node.js 20
- PostgreSQL on the same droplet
- Nginx reverse proxy
- PM2 for keeping the three Node apps running
- Certbot for free SSL

## 1. Create the droplet

In DigitalOcean, create:

- Image: `Ubuntu 24.04 LTS`
- Plan: at least `2 GB RAM / 2 vCPU`
- Authentication: SSH key preferred
- Optional: attach a reserved IP if this will be long-lived

After creation, note the droplet public IP.

## 2. Point your domains to the droplet

Create DNS `A` records:

- `api.yourdomain.com` -> `YOUR_DROPLET_IP`
- `engineer.yourdomain.com` -> `YOUR_DROPLET_IP`
- `admin.yourdomain.com` -> `YOUR_DROPLET_IP`

Wait for DNS propagation before requesting SSL.

## 3. SSH into the droplet

```bash
ssh root@YOUR_DROPLET_IP
```

If you use a sudo user instead of root, use that account for the rest of the guide.

## 4. Update the server

```bash
apt update
apt upgrade -y
timedatectl set-timezone Africa/Dar_es_Salaam
```

## 5. Install required packages

```bash
apt install -y git curl unzip build-essential nginx certbot python3-certbot-nginx postgresql postgresql-contrib ufw
```

## 6. Enable the firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status
```

## 7. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
```

Expected major versions:

- `node` -> `v20.x`
- `npm` -> `10.x`

## 8. Install PM2 globally

```bash
npm install -g pm2
pm2 -v
```

## 9. Clone the project

Choose a deployment folder. This guide uses `/var/www/iet`.

```bash
mkdir -p /var/www
cd /var/www
git clone YOUR_REPOSITORY_URL iet
cd /var/www/iet
```

Your structure should look like:

- `/var/www/iet/api`
- `/var/www/iet/engineer-portal`
- `/var/www/iet/admin-portal`

## 10. Create PostgreSQL database and user

Login to PostgreSQL:

```bash
sudo -u postgres psql
```

Run these SQL commands:

```sql
CREATE DATABASE iet_db;
CREATE USER iet_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE iet_db TO iet_user;
\q
```

## 11. Prepare the API environment file

```bash
cd /var/www/iet/api
cp .env.example .env
nano .env
```

Set production values like this:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://api.yourdomain.com
API_URL=https://api.yourdomain.com/api/v1
FRONTEND_ORIGINS=https://engineer.yourdomain.com,https://admin.yourdomain.com

DATABASE_ENABLED=true
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=iet_user
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
DB_NAME=iet_db

JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=REPLACE_WITH_ANOTHER_LONG_RANDOM_SECRET
JWT_REFRESH_EXPIRATION=7d

ENCRYPTION_KEY=REPLACE_WITH_32_CHAR_SECRET_VALUE

THROTTLE_TTL=60
THROTTLE_LIMIT=100

SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=IET Tanzania
SMTP_TLS_REJECT_UNAUTHORIZED=false

CLICKPESA_BASE_URL=https://api.clickpesa.com/third-parties
CLICKPESA_CLIENT_ID=
CLICKPESA_API_KEY=
CLICKPESA_CHECKSUM_KEY=
CLICKPESA_USE_CHECKSUM=false
CLICKPESA_CALLBACK_URL=

DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_ENDPOINT=
DO_SPACES_REGION=sfo3
DO_SPACES_BUCKET=
DO_SPACES_CDN_URL=
```

Notes:

- Replace every secret with a real production value.
- `FRONTEND_ORIGINS` must match your real frontend domains exactly.
- If you use payment callbacks, set them to your live API domain.

## 12. Prepare the engineer portal environment file

```bash
cd /var/www/iet/engineer-portal
cp .env.example .env
nano .env
```

Use:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
SESSION_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
```

## 13. Prepare the admin portal environment file

```bash
cd /var/www/iet/admin-portal
cp .env.example .env
nano .env
```

Use:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

## 14. Install dependencies

Run these commands one app at a time.

API:

```bash
cd /var/www/iet/api
npm ci
```

Engineer portal:

```bash
cd /var/www/iet/engineer-portal
npm ci
```

Admin portal:

```bash
cd /var/www/iet/admin-portal
npm ci
```

## 15. Build the apps

API:

```bash
cd /var/www/iet/api
npm run build
```

Engineer portal:

```bash
cd /var/www/iet/engineer-portal
npm run build
```

Admin portal:

```bash
cd /var/www/iet/admin-portal
npm run build
```

## 16. Run API migrations

After the API build succeeds, run:

```bash
cd /var/www/iet/api
npm run migration:run
```

If the project seeds an admin automatically from `.env`, make sure those values are correct before first start.

## 17. Start the apps with PM2

Start the API:

```bash
cd /var/www/iet/api
pm2 start npm --name iet-api -- run start:prod
```

Start the engineer portal on port `4000`:

```bash
cd /var/www/iet/engineer-portal
PORT=4000 pm2 start npm --name iet-engineer -- start
```

Start the admin portal on port `4100`:

```bash
cd /var/www/iet/admin-portal
PORT=4100 pm2 start npm --name iet-admin -- start
```

Check status:

```bash
pm2 status
pm2 logs --lines 100
```

Make PM2 start on reboot:

```bash
pm2 startup systemd
```

PM2 will print one command. Run that command exactly, then run:

```bash
pm2 save
```

## 18. Configure Nginx reverse proxy

Create an Nginx config file:

```bash
nano /etc/nginx/sites-available/iet
```

Paste this config:

```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name engineer.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/iet /etc/nginx/sites-enabled/iet
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 19. Install SSL certificates

Only do this after DNS records are pointing correctly.

```bash
certbot --nginx -d api.yourdomain.com -d engineer.yourdomain.com -d admin.yourdomain.com
```

Choose the option to redirect HTTP to HTTPS when prompted.

Test auto-renewal:

```bash
certbot renew --dry-run
```

## 20. Verify everything

Check the three apps locally on the droplet:

```bash
curl http://127.0.0.1:3000/health
curl -I http://127.0.0.1:4000
curl -I http://127.0.0.1:4100
```

Then verify public URLs in the browser:

- `https://api.yourdomain.com/health`
- `https://api.yourdomain.com/api/docs` if Swagger is enabled
- `https://engineer.yourdomain.com`
- `https://admin.yourdomain.com`

## 21. How to deploy updates later

When you push new code, SSH into the droplet and run:

API:

```bash
cd /var/www/iet
git pull

cd /var/www/iet/api
npm ci
npm run build
npm run migration:run
pm2 restart iet-api
```

Engineer portal:

```bash
cd /var/www/iet/engineer-portal
npm ci
npm run build
pm2 restart iet-engineer
```

Admin portal:

```bash
cd /var/www/iet/admin-portal
npm ci
npm run build
pm2 restart iet-admin
```

If frontend env values change, rebuild the frontend after editing `.env`.

## 22. Useful commands

PM2:

```bash
pm2 status
pm2 logs iet-api
pm2 logs iet-engineer
pm2 logs iet-admin
pm2 restart iet-api
pm2 restart iet-engineer
pm2 restart iet-admin
```

Nginx:

```bash
nginx -t
systemctl status nginx
systemctl reload nginx
```

PostgreSQL:

```bash
sudo -u postgres psql
systemctl status postgresql
```

## 23. Recommended production hardening

- Disable root SSH login and use a sudo user.
- Use SSH keys only.
- Store database backups outside the droplet.
- Set strong secrets for JWT, encryption, and session values.
- Set real SMTP credentials before enabling email flows.
- Monitor disk usage because uploads and logs can grow over time.
- Consider DigitalOcean Managed PostgreSQL if this system becomes critical.

## 24. Optional alternate domain layout

If you want one main site instead of three subdomains, you can also use:

- `https://yourdomain.com` -> engineer portal
- `https://admin.yourdomain.com` -> admin portal
- `https://yourdomain.com/api/v1` -> API through Nginx path proxy

That layout needs a different Nginx config. The subdomain layout above is cleaner and simpler for this repo.
