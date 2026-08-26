# 🧠 Learn-it HCL

**AI-Powered Personalized Learning Platform**

> Understand the learner → Determine what they know → Determine what they need → Select the best next activity → Explain why → Measure if it worked → Adapt.

## Architecture

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy (async) + PostgreSQL + pgvector + Redis
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **AI**: OpenAI / Anthropic / Google / Local (Ollama) — provider abstraction
- **Gateway**: Apache APISIX (rate limiting, auth, routing)
- **Architecture**: Modular Monolith with Row-Level Multi-Tenancy

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js ≥ 20
- pnpm ≥ 9
- Python ≥ 3.12
- PostgreSQL 16 (or use Docker)

### 1. Clone & Install

```bash
git clone <repo-url> Learn-it-HCL
cd Learn-it-HCL
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Infrastructure

```bash
cd infra/docker
docker compose up -d postgres redis
```

### 4. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Run migrations
alembic upgrade head

# Seed demo data
python -m scripts.seed

# Start server
uvicorn app.main:app --reload --port 8000
```

### 5. Frontend

```bash
cd apps/web
pnpm dev
```

### 6. Open

- **App**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **API**: http://localhost:8000/api/v1

### Demo Credentials

| Email | Password | Role |
|---|---|---|
| student@learnit.dev | Password1! | Student |
| teacher@learnit.dev | Password1! | Teacher |
| admin@learnit.dev | Password1! | Admin |

## Project Structure

```
Learn-it-HCL/
├── apps/
│   └── web/                    # Next.js frontend
│       └── src/app/            # App Router pages
├── backend/
│   ├── app/
│   │   ├── config.py           # Pydantic settings
│   │   ├── database.py         # SQLAlchemy async engine
│   │   ├── main.py             # FastAPI app factory
│   │   ├── core/               # Security, permissions, errors
│   │   ├── middleware/          # Request ID, tenant
│   │   └── modules/            # Domain modules
│   │       ├── identity/       # Auth, users, organizations
│   │       ├── learners/       # Profiles, preferences, goals
│   │       ├── skills/         # Skill graph, career roles
│   │       ├── content/        # Courses, lessons, resources
│   │       ├── assessments/    # Questions, quizzes, diagnostics
│   │       ├── mastery/        # Knowledge state tracking
│   │       ├── recommendations/# 11-stage recommendation engine
│   │       ├── learning_paths/ # DAG-based learning paths
│   │       ├── gamification/   # XP, streaks, badges, quests
│   │       ├── ai_assistant/   # Tutor, onboarding, provider abstraction
│   │       ├── attendance/     # OTP, QR, policies
│   │       ├── analytics/      # Dashboards, event tracking
│   │       └── administration/ # Admin, feature flags, audit
│   ├── alembic/                # Database migrations
│   └── scripts/                # Seed data, utilities
├── packages/
│   └── types/                  # Shared TypeScript types
├── infra/
│   ├── docker/                 # Docker Compose, Dockerfiles
│   └── apisix/                 # API Gateway config
└── docs/
    └── architecture/           # ADRs, system design
```

## Core Design Principles

1. **Mastery ≠ Completion** — Mastery is evidence-based, not time-based
2. **Deterministic + LLM** — Rules decide what's allowed, ML estimates what's likely, LLM explains
3. **Every recommendation is explainable** — Machine-readable evidence + human-friendly explanations
4. **Anti-gaming built in** — XP idempotency, reward caps, skill verification
5. **Tenant isolation** — Row-level `tenant_id` on all data, enforced at the data-access layer

## Key Features

| Feature | Status |
|---|---|
| AI-guided onboarding | ✅ |
| Skill graph with prerequisites | ✅ |
| Evidence-based mastery tracking | ✅ |
| 11-stage recommendation engine | ✅ |
| Adaptive diagnostics | ✅ |
| AI tutor (scaffolded) | ✅ |
| XP, streaks, badges, quests | ✅ |
| Attendance (OTP/QR) | ✅ |
| RBAC with 5 roles | ✅ |
| Multi-tenancy | ✅ |
| Daily missions | ✅ |

## License

MIT
