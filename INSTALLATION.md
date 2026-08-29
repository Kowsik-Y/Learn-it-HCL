# Learn-it HCL — Installation Guide

This document outlines the setup process for the Learn-it HCL platform.

## Architecture Overview

The system consists of three main components:
1. **Database**: PostgreSQL
2. **Web / API Gateway**: Next.js (Handles Auth, Database CRUD, and the UI)
3. **ML Service**: Python FastAPI (Handles AI Tutor, Recommendations, and Mastery Calculation)

---

## Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or v20)
- [pnpm](https://pnpm.io/installation) (Enable via `corepack enable pnpm`)
- [Python 3.12+](https://www.python.org/downloads/)
- [Docker & Docker Compose](https://www.docker.com/)

---

## Quick Setup (Recommended)

You can run our initialization script which sets up both the Node.js and Python environments, installs dependencies, and creates `.env` files.

### For macOS / Linux:
```bash
chmod +x init.sh
./init.sh
```

### For Windows (PowerShell):
```powershell
.\init.ps1
```

---

## Running the Application Locally (Development)

Once initialized, follow these steps to run the application in development mode:

### 1. Start the Database
Open a terminal in the root directory and start the PostgreSQL container:
```bash
docker-compose up -d db
```

### 2. Initialize the Database Schema
Sync the Prisma schema with your local database:
```bash
cd apps/web
npx prisma db push
```

### 3. Start the Web App (Next.js)
In the `apps/web` directory:
```bash
pnpm dev
```
*The web app will run on **http://localhost:3000**.*

### 4. Start the ML Service (Python)
Open a new terminal, navigate to the `backend` directory, activate the virtual environment, and start the FastAPI server:

**macOS/Linux:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --port 8001 --reload
```

**Windows:**
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --port 8001 --reload
```
*The ML service will run on **http://localhost:8001**. You can view the API documentation at **http://localhost:8001/docs**.*

---

## Running with Docker (Production-like)

To run the entire stack (Database, Web, and ML Service) using Docker Compose:

1. Make sure your `.env` files (`apps/web/.env.local` and `backend/.env`) are properly configured.
2. If you want to use OpenAI/Anthropic features, set `OPENAI_API_KEY` in your environment or in the `.env` file before running docker compose.
3. Run the following command from the root directory:

```bash
docker-compose up --build -d
```

This will:
- Start PostgreSQL on port `5432`.
- Build and start the ML Service on port `8001`.
- Build and start the Next.js Web App on port `3000`. (It will automatically run `npx prisma db push` before starting).

To view logs:
```bash
docker-compose logs -f
```

To stop all services:
```bash
docker-compose down
```

---

## Important Environment Variables

### Web (`apps/web/.env.local`)
- `DATABASE_URL`: Connection string to the PostgreSQL DB.
- `JWT_SECRET_KEY`: Secret used for signing JWTs.
- `ML_SERVICE_URL`: URL to the Python ML Service (default `http://localhost:8001`).

### ML Service (`backend/.env`)
- `DATABASE_URL`: Connection string (read-only usage for recommendations).
- `OPENAI_API_KEY`: API key for the AI Tutor and onboarding features.
