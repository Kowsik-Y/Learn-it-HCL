# 🧠 Learn-it HCL

**The Next-Gen Evidence-Based AI Learning Platform**

> Understand the learner → Quantify true mastery → Predict memory retention & dropout risk → Deliver adaptive personalized learning → Explain every decision.

---

## 🌟 Highlights & Core Innovations

- **Mastery ≠ Completion**: Traditional platforms treat video watching as competence. Learn-it HCL models true knowledge state using probabilistic Bayesian Knowledge Tracing (**BKT**).
- **FSRS v4 Spaced Repetition**: Memory retention decay scheduling replaces outdated Leitner/SM-2 algorithms to review skills right before forgetting.
- **Computerized Adaptive Testing (CAT)**: 2-Parameter Logistic (**2PL IRT**) testing with Newton-Raphson MLE cuts assessment question counts by 60% while maintaining diagnostic accuracy.
- **Neural Video Ranker**: 3-layer PyTorch MLP re-ranks curated YouTube video tutorials per lesson by matching learner ability $\theta$, video duration, and topic difficulty.
- **Dropout Risk Predictor**: Early warning attrition radar scores learner churn risk (0–100%) and auto-suggests targeted remediation nudges.
- **Explainable AI**: Every single recommendation, video tier selection, and question choice comes with a human-friendly *"Why this?"* explainability breakdown.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       LEARN-IT HCL PLATFORM ARCHITECTURE                     │
└──────────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────┐      ┌─────────────────────────────────────┐
 │        NEXT.JS 15 FRONTEND          │      │       FASTAPI ML MICROSERVICE       │
 │  • Adaptive Quiz & Live θ Gauge     │      │  • BKT — Bayesian Knowledge Tracing │
 │  • Skill Mastery Map (Visual Rings) │◄────►│  • FSRS v4 Spaced Repetition        │
 │  • FSRS Spaced Review Queue         │      │  • 2PL IRT + CAT Adaptive Engine    │
 │  • Gamification (XP/Streaks/Quests) │      │  • Dropout & Churn Risk Predictor   │
 │  • Teacher Attrition Radar          │      │  • Neural Video Ranker (PyTorch)    │
 │  • Prerequisite Learning Paths DAG  │      │  • 11-Stage Recommendation Pipeline │
 └─────────────────────────────────────┘      └─────────────────────────────────────┘
                    │                                           │
                    ▼                                           ▼
 ┌─────────────────────────────────────┐      ┌─────────────────────────────────────┐
 │     APACHE APISIX GATEWAY & AUTH    │      │    POSTGRESQL + PGVECTOR + REDIS    │
 │  • Multi-Tenant Row Security        │      │  • BKT / FSRS / IRT state per user  │
 │  • RBAC (5 Roles: Student to Admin) │      │  • Curated adaptive video catalogue │
 └─────────────────────────────────────┘      └─────────────────────────────────────┘
```

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend (ML Microservice)**: Python 3.12 + FastAPI + PyTorch + scikit-learn / joblib
- **Database & Data Access**: PostgreSQL 16 + pgvector + Prisma (Node.js) + SQLAlchemy Async (Python) + Redis
- **Gateway & Multi-Tenancy**: Apache APISIX with row-level `tenant_id` isolation

---

## 🧠 Core ML Engines

| Engine | Algorithm | Location | Purpose |
|---|---|---|---|
| **BKT** | Bayesian Knowledge Tracing HMM | [`backend/app/modules/mastery/bkt.py`](file:///e:/Hcl/backend/app/modules/mastery/bkt.py) | Updates latent mastery $P(L_t)$ from quiz attempts, practice, and watch events. |
| **FSRS v4** | Free Spaced Repetition Scheduler | [`backend/app/modules/mastery/fsrs.py`](file:///e:/Hcl/backend/app/modules/mastery/fsrs.py) | Calculates retention $R(t, S)$ and schedules optimal review intervals. |
| **2PL IRT + CAT** | Item Response Theory + Fisher Info | [`backend/app/modules/assessments/irt.py`](file:///e:/Hcl/backend/app/modules/assessments/irt.py) | Selects next question maximizing $I(\theta)$; estimates learner ability $\theta$. |
| **Dropout Risk** | Logistic Churn Predictor | [`backend/app/modules/analytics/risk_predictor.py`](file:///e:/Hcl/backend/app/modules/analytics/risk_predictor.py) | Predicts attrition risk from streak, inactivity, pass rates, and consecutive failures. |
| **Neural Video Ranker** | PyTorch 3-Layer MLP | [`backend/app/modules/recommendations/video_ranker.py`](file:///e:/Hcl/backend/app/modules/recommendations/video_ranker.py) | Neural re-ranking of curated YouTube videos matching learner ability. |
| **Recommendation Engine** | 11-Stage Pipeline | [`backend/app/modules/recommendations/engine.py`](file:///e:/Hcl/backend/app/modules/recommendations/engine.py) | End-to-end goal interpretation, prerequisite filtering, and personalized ranking. |

---

## 🖥️ Application Pages & Features

| Route | Page | Description |
|---|---|---|
| `/dashboard` | **Learner Dashboard** | Unified metrics: Level/XP progression, daily missions, active quests, and mastery highlights. |
| `/courses` | **Courses & Curriculum** | Catalog with AI Course Generator, interactive video player, and module navigation. |
| `/courses/[id]/quiz` | **Adaptive Diagnostic Quiz** | Real-time CAT quiz with live ability $\theta$ gauge, Fisher Info reason panel, and completion stats. |
| `/skills` | **Skill Mastery Map** | Evidence-based skill map with circular SVG progress rings, confidence, and retention status. |
| `/review` | **Spaced Review Queue** | FSRS v4 daily card queue sorted by urgency with Again/Hard/Good/Easy rating flow. |
| `/achievements` | **Gamification & Quests** | Level hero banner, day streak with freeze protection, categorized badges, quests, and XP log. |
| `/learning-paths` | **Visual Roadmap** | Prerequisite-ordered timeline roadmap with active node pulsing and duration estimates. |
| `/teacher/analytics` | **Teacher Radar** | Class attrition radar, skill mastery heatmap matrix, and AI remediation suggestions. |
| `/onboarding` | **AI Onboarding** | Conversational LLM onboarding diagnosing user goals and background. |

---

## 🚀 Quick Start

### Prerequisites

- Docker Desktop
- Node.js ≥ 20
- pnpm ≥ 9
- Python ≥ 3.12
- PostgreSQL 16 (or Docker)

### 1. Clone & Install

```bash
git clone https://github.com/Kowsik-Y/Learn-it-HCL.git
cd Learn-it-HCL
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Configure your database and API keys (Groq/OpenAI/Anthropic)
```

### 3. Start Infrastructure (Postgres & Redis)

```bash
cd infra/docker
docker compose up -d postgres redis
```

### 4. Run ML Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e ".[dev]"

# Run database migrations & seed data
alembic upgrade head
python -m scripts.seed

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 5. Run Next.js Frontend

```bash
cd apps/web
pnpm dev
```

### 6. Access Points

- **Web App**: `http://localhost:3000`
- **ML API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

### 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Student** | `student@learnit.dev` | `Password1!` |
| **Teacher** | `teacher@learnit.dev` | `Password1!` |
| **Admin** | `admin@learnit.dev` | `Password1!` |

---

## 📁 Repository Structure

```
Learn-it-HCL/
├── apps/
│   └── web/                         # Next.js 15 Frontend
│       ├── app/                     # App Router pages ((app), (auth), api)
│       │   ├── (app)/
│       │   │   ├── dashboard/       # Metrics & daily missions
│       │   │   ├── courses/         # Courses & [courseId]/quiz
│       │   │   ├── skills/          # Skill mastery map
│       │   │   ├── review/          # FSRS spaced review queue
│       │   │   ├── achievements/    # XP, badges, and quests
│       │   │   ├── learning-paths/  # Prerequisite DAG timeline
│       │   │   └── teacher/         # Teacher analytics radar & heatmap
│       │   └── api/                 # Next.js proxy & Prisma handlers
│       ├── components/              # UI & Interactive components
│       └── lib/                     # API client, auth & db utilities
├── backend/
│   ├── app/                         # FastAPI ML Microservice
│   │   ├── core/                    # RBAC, security, and errors
│   │   ├── middleware/              # Gateway auth & tenant propagation
│   │   └── modules/
│   │       ├── assessments/         # 2PL IRT + CAT adaptive router
│   │       ├── analytics/           # Dropout risk predictor router
│   │       ├── mastery/             # BKT & FSRS v4 retention engines
│   │       ├── recommendations/     # 11-stage pipeline & video ranker
│   │       └── ai_assistant/        # Scaffolded AI tutor chat
│   ├── alembic/                     # Migrations
│   └── scripts/                     # Model training & seeding scripts
├── infra/
│   ├── docker/                      # Docker Compose definitions
│   └── apisix/                      # Gateway configuration
└── packages/
    └── types/                       # Shared TypeScript contracts
```

---

## 🏆 Key Features Comparison

| Feature | Coursera / Udemy | Khan Academy | Duolingo | **Learn-it HCL** |
|---|---|---|---|---|
| **Mastery Tracking** | Video Completion | Quiz Scores | Streak Count | **BKT Probabilistic $P(L_t)$** |
| **Spaced Repetition** | None | Basic | Leitner System | **FSRS v4 ML Scheduler** |
| **Diagnostic Testing** | Fixed Length | Static Quizzes | Fixed Tests | **2PL IRT + CAT (Fisher Info)** |
| **Video Curation** | Static / Manual | Static | N/A | **PyTorch Neural MLP Ranker** |
| **Student Attrition** | None | None | None | **Dropout Risk Predictor** |
| **Explainability** | No | Partial | No | **Full "Why this?" reason strings** |

---

## 📄 License

MIT © Learn-it HCL Team
