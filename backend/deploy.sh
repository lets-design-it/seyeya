#!/bin/bash
# ==============================================================================
# SEYEYA COURTS - AUTOMATED DEPLOYMENT SCRIPT
# ==============================================================================
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
if curl -s http://127.0.0.1:8000/health | grep -q "healthy"; then
    echo " Backend is healthy and running!"
else
    echo " Health check did not return healthy. Check logs:"
    docker compose -f docker-compose.prod.yml logs --tail=30 backend
    exit 1
fi

echo "=== Deployment Completed Successfully! ==="
