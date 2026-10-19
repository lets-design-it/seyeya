# SEYEYA Courts - DigitalOcean Deployment Guide
## Deploying PostgreSQL Database (from Neon) & FastAPI Backend to DigitalOcean

This guide provides step-by-step instructions for:
1. **Migrating your PostgreSQL database from Neon to DigitalOcean** (preserving all schema, seed data, user accounts, and tables).
2. **Deploying the FastAPI backend, Celery background worker, and Redis on a DigitalOcean Droplet** with Docker Compose, Nginx reverse proxy, and automated SSL (HTTPS).
3. **Alternative: Deploying to DigitalOcean App Platform (PaaS)** if a fully managed serverless container environment is preferred.

---

## Architecture Overview

```
                      Internet
                         │
                 [ DNS / Domain ]
              (api.seyeyacourts.com)
                         │
                         ▼
        ┌────────────────────────────────┐
        │ DigitalOcean Droplet           │
        │                                │
        │   ┌────────────────────────┐   │
        │   │ Nginx (Port 80/443 SSL)│   │
        │   └───────────┬────────────┘   │
        │               │ proxy_pass     │
        │               ▼                │
        │   ┌────────────────────────┐   │
        │   │ FastAPI (Port 8000)    │   │
        │   │ (App / API Server)     │   │
        │   └──────┬──────────┬──────┘   │
        │          │          │          │
        │          ▼          ▼          │
        │      ┌───────┐  ┌───────────┐  │
        │      │ Redis │◄─┤ Celery    │  │
        │      │       │  │ Worker    │  │
        │      └───────┘  └───────────┘  │
        │          │                     │
        │          │ uploads persistent  │
        │          ▼ storage volume      │
        │     [/app/uploads]             │
        └──────────┬─────────────────────┘
                   │
                   ▼ (Encrypted SSL Connection)
        ┌────────────────────────────────┐
        │ DigitalOcean Managed Database  │
        │ (PostgreSQL 15 / 16)           │
        │ (Migrated from Neon)           │
        └────────────────────────────────┘
```

---

## Pre-requisites & Checklist

Before starting, ensure you have:
- [ ] A **DigitalOcean Account** with billing set up.
- [ ] A **Domain Name** (e.g. `seyeyacourts.com` or subdomain like `api.seyeyacourts.com`).
- [ ] Local access to `pg_dump` and `psql` (part of PostgreSQL client tools).
- [ ] SSH key added to your DigitalOcean account for server access.
- [ ] Neon connection string from `backend/.env`.

---

## PART 1: Database Migration (Neon → DigitalOcean)

You have two choices for PostgreSQL on DigitalOcean:
- **Option A (Recommended for Production)**: **DigitalOcean Managed Database for PostgreSQL**. Provides automated daily backups, high availability, point-in-time recovery, connection pooling with PgBouncer, and firewall security.
- **Option B (Budget / Dev Setup)**: **Self-hosted PostgreSQL on the same Droplet** via Docker. Zero additional cost, but you are responsible for volume backups.

The instructions below focus on **Option A** (Managed Database), which matches Neon's managed cloud nature.

### Step 1.1: Create DigitalOcean Managed PostgreSQL
1. Log in to the [DigitalOcean Cloud Console](https://cloud.digitalocean.com/).
2. Click **Create** (top right) → **Databases**.
3. Choose **PostgreSQL** (version 15 or 16 recommended).
4. Select a datacenter region close to your primary users (e.g., Frankfurt `fra1`, London `lon1`, or New York `nyc1`).
5. Choose a cluster plan (e.g., Basic $15/month node: 1GB RAM / 1 vCPU / 10GB disk).
6. Under **Choose a unique database cluster name**, name it `seyeya-postgres`.
7. Click **Create Database Cluster**.

### Step 1.2: Obtain DigitalOcean Connection Details
Once provisioned:
1. Under **Connection Details**, toggle to **Connection String** or **Flags**.
2. Note the parameters:
   - **Host**: e.g., `db-postgresql-fra1-xxxxx-do-user-xxxxx-0.b.db.ondigitalocean.com`
   - **Port**: `25060` (or `25061` if using connection pool)
   - **User**: `doadmin`
   - **Password**: `<secure_password>`
   - **Database**: `defaultdb` (or create a new database named `seyeya_db` in the **Users & Databases** tab)
   - **SSL Mode**: `require`
3. Download the **CA Certificate** (`ca-certificate.crt`) from the dashboard if needed.

### Step 1.3: Dump Database from Neon
Export your current database from Neon using `pg_dump`. Run this command on your local terminal:

```bash
# Export the entire database (schema + data) from Neon
pg_dump \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="postgresql://neondb_owner:npg_qLkyd6hWZHg8@ep-plain-credit-ad9ex0q7.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  -F p \
  -f neon_seyeya_dump.sql
```

> **Why `--no-owner` and `--no-privileges`?**  
> Neon uses internal users (`neondb_owner`). Omitting owners and privileges ensures the SQL statements run cleanly without permission errors when imported into DigitalOcean's `doadmin` user.

### Step 1.4: Import Dump into DigitalOcean PostgreSQL
Run `psql` to restore the dump directly into DigitalOcean:

```bash
psql \
  "postgresql://doadmin:<DO_PASSWORD>@<DO_HOST>:<DO_PORT>/<DO_DBNAME>?sslmode=require" \
  -f neon_seyeya_dump.sql
```

### Step 1.5: Verify the Migration
Connect to your DigitalOcean PostgreSQL database and verify table counts:

```bash
psql "postgresql://doadmin:<DO_PASSWORD>@<DO_HOST>:<DO_PORT>/<DO_DBNAME>?sslmode=require"
```

Inside the `psql` console, run:
```sql
-- Check total number of tables
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check critical tables exist
\dt

-- Check user count or room count
SELECT count(*) FROM users;
SELECT count(*) FROM room_categories;
SELECT version_num FROM alembic_version;

\q
```

---

## PART 2: Droplet Setup (Server Provisioning)

### Step 2.1: Create a DigitalOcean Droplet
1. Go to DigitalOcean Console → **Create** → **Droplets**.
2. **OS Image**: Ubuntu 24.04 LTS (x64) or Ubuntu 22.04 LTS.
3. **Droplet Plan**:
   - **Basic Droplet**
   - CPU Option: **Regular (SSD)** or **Premium AMD/Intel**
   - Memory: **2 GB RAM / 1 vCPU** ($12/mo) or 4 GB RAM ($24/mo recommended for production traffic).
4. **Datacenter Region**: Choose the **same region** as your Managed PostgreSQL database (this allows free private VPC networking and lowest latency).
5. **Authentication**: Choose **SSH Key** (select or add your public SSH key).
6. **Hostname**: e.g., `seyeya-backend-prod`.
7. Click **Create Droplet**.

### Step 2.2: Initial Server Hardening & Dependencies
SSH into your droplet:
```bash
ssh root@<DROPLET_IP>
```

Run updates and install essential tools:
```bash
# Update package repositories
apt-get update && apt-get upgrade -y

# Install essential tools
apt-get install -y curl wget git ufw certbot python3-certbot-nginx fail2ban htop postgresql-client
```

### Step 2.3: Configure Server Firewall (UFW)
Secure your droplet so only HTTP, HTTPS, and SSH are open:
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Let's Encrypt validation)
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

### Step 2.4: Install Docker & Docker Compose Plugin
```bash
# Install Docker repository and GPG keys
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### Step 2.5: Secure DigitalOcean Database Access (Trusted Sources)
1. Go back to your DigitalOcean Cloud Console → **Databases** → `seyeya-postgres`.
2. Under **Settings** → **Trusted Sources**, click **Edit**.
3. Add your **Droplet** (select from the dropdown) and/or your Droplet's Private IP.
4. This ensures nobody else on the public internet can attempt to connect to your database.

---

## PART 3: Deploying the Backend on the Droplet

### Step 3.1: Clone the Seyeya Repository
On the Droplet:
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/<YOUR_ORGANIZATION_OR_USERNAME>/seyeya.git
cd /var/www/seyeya/backend
```

### Step 3.2: Configure Production `.env`
Create `/var/www/seyeya/backend/.env`:
```bash
nano .env
```

Paste and adjust the production configuration:
```ini
# ==============================================================================
# SEYEYA BACKEND PRODUCTION CONFIGURATION
# ==============================================================================

# DigitalOcean Managed PostgreSQL
# Note: DATABASE_URL is for asyncpg, DATABASE_SYNC_URL is for alembic/psycopg2
# The backend automatically adapts sslmode=require to ssl=require
DATABASE_URL="postgresql://doadmin:<DO_PASSWORD>@<DO_HOST>:<DO_PORT>/<DO_DBNAME>?sslmode=require"
DATABASE_SYNC_URL="postgresql://doadmin:<DO_PASSWORD>@<DO_HOST>:<DO_PORT>/<DO_DBNAME>?sslmode=require"

# Security (Generate a fresh 32-byte secret: openssl rand -hex 32)
SECRET_KEY=paste_generated_32_byte_secret_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Encryption Key for sensitive fields (PCI DSS compliance)
ENCRYPTION_KEY=3k8B_KkP0vN_5Z9m2n_1sDF6g7h8J9k0L1m2N3o4P5Q=

# Redis & Celery (Using internal Docker network service name 'redis')
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Email Integration (Gmail SMTP or SendGrid / Amazon SES)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SEND_FROM_EMAIL=noreply@seyeyacourts.com

# Frontend URL (Used for password reset links & email notifications)
FRONTEND_URL=https://seyeyacourts.com

# API Settings
API_VERSION=v1
DEBUG=False
ENVIRONMENT=production

# File Uploads
UPLOAD_DIR=uploads
```

Generate secure secrets on your server:
```bash
# Generate SECRET_KEY:
openssl rand -hex 32
```

### Step 3.3: Production Docker Compose Setup
The repository includes a `docker-compose.yml`. For production on the droplet, create `docker-compose.prod.yml` in `/var/www/seyeya/backend/`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: seyeya_redis
    restart: always
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: seyeya_backend
    restart: always
    env_file:
      - .env
    ports:
      # Bind only to localhost so Nginx handles public traffic & SSL
      - "127.0.0.1:8000:8000"
    volumes:
      # Persistent storage for uploaded room photos, menu extra photos, receipts
      - ./uploads:/app/uploads
    depends_on:
      redis:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

  celery_worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: seyeya_celery
    restart: always
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      redis:
        condition: service_healthy
    command: celery -A app.tasks.celery_app worker -l info -c 2

volumes:
  redis_data:
```

### Step 3.4: Build and Start Containers
```bash
# Ensure upload directory exists with proper permissions
mkdir -p /var/www/seyeya/backend/uploads
chmod -R 775 /var/www/seyeya/backend/uploads

# Build and start services in background
docker compose -f docker-compose.prod.yml up -d --build
```

Verify all containers are healthy and running:
```bash
docker compose -f docker-compose.prod.yml ps
```

Check the logs for startup errors:
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

Test localhost endpoint:
```bash
curl http://127.0.0.1:8000/health
# Expected output: {"status":"healthy","database":"connected"}
```

### Step 3.5: Run Alembic Database Migrations
Run migrations inside the running container to ensure DigitalOcean schema is 100% synchronized:
```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## PART 4: Nginx Reverse Proxy & Free SSL (Let's Encrypt)

Now configure public access so users and the frontend can reach `https://api.seyeyacourts.com`.

### Step 4.1: Configure DNS
In your DNS provider (Cloudflare, Namecheap, GoDaddy, or DigitalOcean DNS):
- Add an **A Record**:
  - **Type**: `A`
  - **Name/Host**: `api` (or `@` if using root domain)
  - **Value**: `<YOUR_DROPLET_PUBLIC_IP>`
  - **TTL**: 300 (or Auto)

Wait 2-5 minutes and verify DNS propagation:
```bash
dig +short api.seyeyacourts.com
```

### Step 4.2: Install and Configure Nginx
Install Nginx on the host:
```bash
apt-get install -y nginx
```

Create an Nginx configuration file for Seyeya:
```bash
nano /etc/nginx/sites-available/seyeya-backend
```

Paste the following configuration (replace `api.seyeyacourts.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name api.seyeyacourts.com;

    # Allow large file uploads (e.g., room gallery images, menu photos)
    client_max_body_size 25M;

    # Proxy all traffic to FastAPI Uvicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for longer requests (reports, exports)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Direct static caching for uploads (optional performance boost)
    location /uploads/ {
        alias /var/www/seyeya/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Enable the site and verify syntax:
```bash
ln -s /etc/nginx/sites-available/seyeya-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### Step 4.3: Issue Free SSL Certificate (HTTPS)
Use Certbot to request a Let's Encrypt TLS/SSL certificate:
```bash
certbot --nginx -d api.seyeyacourts.com
```
- Enter your email address for renewal notifications.
- Agree to terms.
- Certbot will automatically edit your Nginx configuration, configure HTTPS redirection, and set up an automatic certificate renewal timer via systemd (`certbot.timer`).

Test certificate renewal:
```bash
certbot renew --dry-run
```

---

## PART 5: Verification & Sanity Checks

Test all core endpoints from your local machine or browser:

### 1. Health Endpoint
```bash
curl -I https://api.seyeyacourts.com/health
# Should return HTTP 200 OK
```

```bash
curl https://api.seyeyacourts.com/health
# Response: {"status":"healthy","database":"connected"}
```

### 2. Swagger Interactive API Documentation
Open in your browser:
```
https://api.seyeyacourts.com/docs
```
*(If `DEBUG=False`, you can verify your endpoints using curl or API tests)*

### 3. Authentication Test
```bash
curl -X POST https://api.seyeyacourts.com/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@seyeyacourts.com&password=<YOUR_PASSWORD>"
```

### 4. Background Celery Worker Test
View the worker logs in real time:
```bash
docker compose -f /var/www/seyeya/backend/docker-compose.prod.yml logs -f celery_worker
```

---

## PART 6: Alternative - DigitalOcean App Platform (PaaS)

If you prefer a serverless/managed platform without managing an Ubuntu Droplet:

1. **Push your code to GitHub/GitLab**.
2. Go to DigitalOcean Console → **Create** → **Apps**.
3. Link your GitHub repository (`seyeya`, branch `backend` or `main`).
4. Set source directory to `/backend`.
5. DigitalOcean App Platform will automatically detect the `Dockerfile`.
6. **Add Components**:
   - **Web Service (`backend`)**:
     - HTTP Port: `8000`
     - Health Check Path: `/health`
     - Resource: Basic ($5 - $12/month)
   - **Worker Service (`celery-worker`)**:
     - Command: `celery -A app.tasks.celery_app worker -l info`
   - **Attached Database**: Link your DigitalOcean Managed PostgreSQL database.
   - **Attached Redis**: Add a managed Redis database cluster.
7. **Important Storage Consideration**:
   - App Platform containers have **ephemeral filesystems** (restarted/redeployed containers lose files stored in `uploads/`).
   - If using App Platform, media uploads should be pointed to **DigitalOcean Spaces** (S3-compatible object storage) rather than local disk.

---

## PART 7: How to Push Code & Reflect Changes on the Server

This section covers the day-to-day developer workflows for updating the live server whenever you write new code, modify database schemas, or add new Python libraries.

---

### Workflow 1: Standard Code Updates (Endpoints, Services, Bug Fixes)

When you edit Python files (`app/api/`, `app/services/`, etc.) locally and want the changes live on DigitalOcean:

#### Step 1: On Your Local Machine (Mac)
Commit and push your changes to your git repository:
```bash
git add .
git commit -m "Add new endpoint / fix bug"
git push origin backend
```

#### Step 2: Reflect Changes on the Droplet (Choose A or B)

**Option A — Directly from your local Mac (One-Liner without SSHing in manually):**
```bash
ssh root@139.59.134.181 "cd /var/www/seyeya/backend && git pull origin backend && docker compose -f docker-compose.prod.yml up -d --build backend celery_worker"
```

**Option B — Inside your Droplet SSH terminal:**
```bash
# 1. Go to backend folder
cd /var/www/seyeya/backend

# 2. Pull the latest commits
git pull origin backend

# 3. Rebuild and restart the backend & worker containers
docker compose -f docker-compose.prod.yml up -d --build backend celery_worker
```
*(Docker will rebuild only the modified layers in a few seconds with zero or minimal downtime).*

---

### Workflow 2: Database Schema & Model Changes (Alembic Migrations)

When you modify SQLAlchemy models in `app/models/` or add new database tables:

#### Step 1: Generate & Push Migration Locally
```bash
# 1. Make sure your local virtual environment is active
source venv/bin/activate

# 2. Generate a new migration revision
alembic revision --autogenerate -m "add_new_columns_or_tables"

# 3. Commit the new migration file in alembic/versions/
git add alembic/versions/ app/models/
git commit -m "Database migration: add new columns or tables"
git push origin backend
```

#### Step 2: Apply Migrations on the Droplet
On your Droplet:
```bash
cd /var/www/seyeya/backend
git pull origin backend

# 1. Apply the new migration to DigitalOcean PostgreSQL
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# 2. Rebuild the backend container with the new models
docker compose -f docker-compose.prod.yml up -d --build backend celery_worker
```

---

### Workflow 3: Adding New Dependencies (`requirements.txt`)

When you add a new Python library to `requirements.txt`:

1. **Locally**: Commit and push:
   ```bash
   git add requirements.txt
   git commit -m "Add new python dependencies"
   git push origin backend
   ```
2. **On Droplet**: Pull and force a clean rebuild so Docker installs the new packages:
   ```bash
   cd /var/www/seyeya/backend
   git pull origin backend
   docker compose -f docker-compose.prod.yml build --no-cache backend celery_worker
   docker compose -f docker-compose.prod.yml up -d
   ```

---

### Workflow 4: Updating Environment Variables (`.env`)

Because `.env` contains secrets and is not tracked in Git:

1. **SSH into the Droplet**:
   ```bash
   ssh root@139.59.134.181
   ```
2. **Edit the file**:
   ```bash
   nano /var/www/seyeya/backend/.env
   ```
3. **Restart containers to load new variables**:
   ```bash
   cd /var/www/seyeya/backend
   docker compose -f docker-compose.prod.yml up -d
   ```

---

### Workflow 5: Updating Nginx Configurations (Domains, Upload Limits, Timeouts)

If you modify `/etc/nginx/sites-available/seyeya-backend`:

1. **Test Nginx syntax for errors**:
   ```bash
   nginx -t
   ```
2. **Reload Nginx gracefully without dropping connections**:
   ```bash
   systemctl reload nginx
   ```

---

### Automated All-In-One Deployment Script (`deploy.sh`)

To make updates effortless, a deployment script is available on your Droplet at `/var/www/seyeya/backend/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "=== [1/4] Pulling latest code from git ==="
cd /var/www/seyeya
git pull origin backend

echo "=== [2/4] Building and updating containers ==="
cd /var/www/seyeya/backend
docker compose -f docker-compose.prod.yml build backend celery_worker
docker compose -f docker-compose.prod.yml up -d

echo "=== [3/4] Running database migrations ==="
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

echo "=== [4/4] Verifying health check ==="
sleep 3
curl -s http://127.0.0.1:8000/health | grep "healthy" && echo " Backend is healthy and running!" || echo " Healthcheck failed! Check logs."

echo "=== Deployment Completed Successfully! ==="
```

#### How to use the script:
- **On the server**:
  ```bash
  /var/www/seyeya/backend/deploy.sh
  ```
- **Or trigger from your local Mac in one command**:
  ```bash
  ssh root@139.59.134.181 "/var/www/seyeya/backend/deploy.sh"
  ```

---

### Checking Logs & Health After Deployment

| Task | Command |
| :--- | :--- |
| **Check container health** | `docker compose -f docker-compose.prod.yml ps` |
| **Stream live backend logs** | `docker compose -f docker-compose.prod.yml logs -f --tail=50 backend` |
| **Stream live Celery logs** | `docker compose -f docker-compose.prod.yml logs -f --tail=50 celery_worker` |
| **Stream live Redis logs** | `docker compose -f docker-compose.prod.yml logs -f --tail=20 redis` |
| **Check Nginx access & errors** | `tail -f /var/log/nginx/error.log` |
| **Restart backend container only** | `docker compose -f docker-compose.prod.yml restart backend` |
| **Hard restart all containers** | `docker compose -f docker-compose.prod.yml restart` |

---

## Summary of Key Environment Changes (Neon → DigitalOcean)

| Variable | Previous (Neon) | Production (DigitalOcean) |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...@ep-...neon.tech/neondb?...` | `postgresql://doadmin:...@db-postgresql-...db.ondigitalocean.com:25060/seyeya_db?sslmode=require` |
| `DATABASE_SYNC_URL` | `postgresql://...@ep-...neon.tech/neondb?...` | `postgresql://doadmin:...@db-postgresql-...db.ondigitalocean.com:25060/seyeya_db?sslmode=require` |
| `REDIS_URL` | `redis://localhost:6379/0` | `redis://redis:6379/0` (internal Docker network) |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | `redis://redis:6379/0` (internal Docker network) |
| `DEBUG` | `True` | `False` |
| `ENVIRONMENT` | `development` | `production` |
| `FRONTEND_URL` | `http://localhost:5173` | `https://seyeyacourts.com` |
| `SECRET_KEY` | Development key | 32-byte secure random string |
