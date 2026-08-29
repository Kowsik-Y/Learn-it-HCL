#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}🚀 Starting Learn-it HCL Development Environment...${NC}"

# Function to clean up background processes
cleanup() {
    echo -e "\n${RED}🛑 Shutting down all services...${NC}"
    
    # Kill the background Next.js and Python processes
    kill $NEXT_PID $PYTHON_PID 2>/dev/null || true
    
    # Stop the database container
    echo -e "${CYAN}Stopping database container...${NC}"
    docker-compose stop db
    
    echo -e "${GREEN}✅ All services stopped.${NC}"
    exit 0
}

# Trap SIGINT (Ctrl+C/Cmd+C) and SIGTERM to run the cleanup function
trap cleanup SIGINT SIGTERM

# 1. Start the database
echo -e "${GREEN}Starting PostgreSQL Database via Docker...${NC}"
docker-compose up -d db

# Wait a few seconds for DB to be ready
sleep 2

# 2. Push Prisma Schema
echo -e "${GREEN}Syncing database schema...${NC}"
(cd apps/web && npx prisma db push)

# 3. Start Next.js in the background
echo -e "${GREEN}Starting Next.js Web App...${NC}"
(cd apps/web && pnpm dev) &
NEXT_PID=$!

# 4. Start Python ML Service in the background
echo -e "${GREEN}Starting Python ML Service...${NC}"
(cd backend && source venv/bin/activate && uvicorn app.main:app --port 8001 --reload) &
PYTHON_PID=$!

echo -e "\n${CYAN}✨ All services are running!${NC}"
echo -e "Web App: http://localhost:3000"
echo -e "ML Service: http://localhost:8001"
echo -e "${RED}Press Ctrl+C to stop all services and exit safely.${NC}\n"

# Wait for background processes so the script stays alive
wait
