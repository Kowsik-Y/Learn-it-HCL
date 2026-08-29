#!/bin/bash
set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Initializing Learn-it HCL project...${NC}\n"

# 1. Setup Web/Next.js (Frontend + API Gateway)
echo -e "${YELLOW}📦 Setting up Web (Next.js)...${NC}"
cd apps/web
corepack enable pnpm
pnpm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${GREEN}✅ Created .env for Web${NC}"
fi

# Generate Prisma Client
npx prisma generate
cd ../..
echo ""

# Create Super Admin
echo -e "${YELLOW}🔑 Setting up initial Super Admin Account...${NC}"
echo -e "${CYAN}Temporarily starting database...${NC}"
docker-compose up -d db
sleep 2
cd apps/web
npx prisma db push
pnpm run create-super-admin
cd ../..
docker-compose stop db
echo -e "${GREEN}✅ Database stopped.${NC}\n"

# 2. Setup Backend/ML Service (Python)
echo -e "${YELLOW}🐍 Setting up ML Service (Python)...${NC}"
cd backend

# Create and activate virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✅ Created Python virtual environment${NC}"
fi

source venv/bin/activate
pip install -e ".[dev]"

if [ ! -f .env ]; then
  cat <<EOF > .env
APP_ENV=development
APP_DEBUG=true
APP_HOST=0.0.0.0
APP_PORT=8001
DATABASE_URL=postgresql+asyncpg://learnit:learnit_dev@localhost:5432/learnit
DATABASE_URL_SYNC=postgresql://learnit:learnit_dev@localhost:5432/learnit
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=5
DB_POOL_RECYCLE=3600
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4o-mini
LOCAL_MODEL_BASE_URL=http://localhost:11434/v1
FF_AI_TUTOR=true
FF_ADAPTIVE_DIAGNOSTICS=true
EOF
  echo -e "${GREEN}✅ Created .env for ML Service${NC}"
fi

deactivate
cd ..
echo ""

# 3. Final Instructions
echo -e "${CYAN}🎉 Initialization complete!${NC}"
echo -e "To start development, follow these steps:"
echo -e "  1. Start the PostgreSQL database: ${YELLOW}docker-compose up -d db${NC}"
echo -e "  2. Push the Prisma schema to the DB: ${YELLOW}cd apps/web && npx prisma db push${NC}"
echo -e "  3. Start the Next.js dev server: ${YELLOW}cd apps/web && pnpm dev${NC}"
echo -e "  4. Start the ML Service: ${YELLOW}cd backend && source venv/bin/activate && uvicorn app.main:app --port 8001 --reload${NC}"
