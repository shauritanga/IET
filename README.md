# IET Project Structure

This project is split into three apps:

- `iet-management-system-core-api-main` - backend API
- `engineer-portal` - engineer/member-facing frontend
- `admin-portal` - admin-facing frontend

## Local Start Commands

### Backend

```bash
cd iet-management-system-core-api-main
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Engineer Portal

```bash
cd engineer-portal
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 20
npm run dev -- --host 0.0.0.0
```

### Admin Portal

```bash
cd admin-portal
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 20
npm run dev -- --host 0.0.0.0
```

## Default Local URLs

- API: `http://localhost:3000`
- Engineer portal: `http://localhost:4000`
- Admin portal: `http://localhost:4100`
