#!/bin/bash
# Quick Start Script for SEYEYA Backend

set -e

echo "========================================="
echo "SEYEYA Courts - Quick Setup"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
python3 --version

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
else
    echo -e "${GREEN}Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}Please update .env with your database credentials${NC}"
fi

# Check PostgreSQL connection
echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
python3 << 'EOF'
try:
    import asyncio
    from app.core.config import settings
    from sqlalchemy import inspect
    from sqlalchemy.ext.asyncio import create_async_engine
    
    async def check_db():
        engine = create_async_engine(settings.DATABASE_URL)
        async with engine.begin() as conn:
            result = await conn.execute("SELECT 1")
            print("✓ Database connection successful")
        await engine.dispose()
    
    asyncio.run(check_db())
except Exception as e:
    print(f"✗ Database connection failed: {e}")
    print("Please ensure PostgreSQL is running and .env is configured correctly")
EOF

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Run database migrations: alembic upgrade head"
echo "3. Start the server: uvicorn app.main:app --reload"
echo "4. Open http://localhost:8000/docs in your browser"
echo ""
