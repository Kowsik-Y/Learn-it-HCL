# Learn-it HCL — Architecture

## System Overview

Learn-it HCL is an **adaptive learning operating system** built as a modular monolith. The platform combines conversational AI, learner profiling, adaptive diagnostics, skill-gap analysis, prerequisite-aware learning paths, and gamification into a single cohesive product.

## Core Principle

```
Rules decide what is allowed.
ML estimates what is likely.
LLM explains and communicates.
```

## Bounded Contexts

```mermaid
graph TB
    subgraph Identity["Identity & Access"]
        Users
        Roles
        Permissions
        Organizations
        Tenants
    end

    subgraph Learner["Learner Domain"]
        Profiles
        Preferences
        Goals
        BehavioralSignals["Behavioral Signals"]
    end

    subgraph Skills["Skill Graph"]
        SkillOntology["Skill Ontology"]
        Prerequisites
        CareerRoles["Career Roles"]
        Competencies
    end

    subgraph Content["Content Domain"]
        Courses
        Modules
        Lessons
        Resources
        Projects
    end

    subgraph Assessment["Assessment Domain"]
        QuestionBank["Question Bank"]
        Diagnostics
        Quizzes
        Exams
        Assignments
    end

    subgraph Mastery["Mastery Domain"]
        KnowledgeState["Knowledge State"]
        Evidence
        RetentionModel["Retention Model"]
    end

    subgraph Recommendation["Recommendation Engine"]
        CandidateGen["Candidate Generation"]
        Ranking
        Explanation
        Feedback
    end

    subgraph LearningPath["Learning Path"]
        PathDAG["Path DAG"]
        MilestoneTracking["Milestones"]
        SkipLogic["Skip Logic"]
        SessionPlanner["Session Planner"]
    end

    subgraph Gamification["Gamification"]
        XP
        Streaks
        Badges
        Quests
        Levels
    end

    subgraph Attendance["Attendance"]
        CheckIn["Check-In"]
        OTP
        QR
        Policies
        Leave
    end

    subgraph AI["AI Assistant"]
        Tutor
        Onboarding
        ContentTagging["Content Tagging"]
        Explanations
    end

    subgraph Analytics["Analytics"]
        EventTracking["Event Tracking"]
        Dashboards
        Reports
    end

    Identity --> Learner
    Learner --> Mastery
    Skills --> Recommendation
    Content --> Recommendation
    Assessment --> Mastery
    Mastery --> Recommendation
    Recommendation --> LearningPath
    LearningPath --> Gamification
    Attendance --> Gamification
    AI --> Recommendation
    Analytics --> Recommendation
```

## Request Flow

```mermaid
sequenceDiagram
    participant Client as Browser/Mobile
    participant APISIX as API Gateway (APISIX)
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL
    participant Redis as Redis Cache
    participant AI as AI Provider

    Client->>APISIX: HTTPS Request
    APISIX->>APISIX: Rate limit, Auth check, Security headers
    APISIX->>Backend: Forward with correlation ID
    Backend->>Backend: Validate tenant, role, permissions
    Backend->>Redis: Check cache
    alt Cache Hit
        Redis-->>Backend: Cached response
    else Cache Miss
        Backend->>DB: Query with tenant isolation
        DB-->>Backend: Data
        Backend->>Redis: Cache result
    end
    alt AI Required
        Backend->>AI: LLM call (PII minimized)
        AI-->>Backend: Structured response
    end
    Backend-->>APISIX: JSON response
    APISIX-->>Client: Response with security headers
```

## Recommendation Pipeline

```mermaid
graph LR
    A[Learner State Builder] --> B[Goal Interpreter]
    B --> C[Skill Gap Analyzer]
    C --> D[Candidate Generator]
    D --> E[Prerequisite Filter]
    E --> F[Mastery Filter]
    F --> G[Personalization Ranker]
    G --> H[Diversity Re-Ranker]
    H --> I[Path Constraint Solver]
    I --> J[Explanation Generator]
    J --> K[Feedback Recorder]
    K -->|Loop| A
```

## AI Architecture

```mermaid
graph TB
    subgraph AIGateway["AI Gateway"]
        ModelRouter["Model Router"]
        RateLimiter["Rate Limiter"]
        TokenBudget["Token Budget"]
    end

    subgraph Providers["AI Providers"]
        OpenAI["OpenAI"]
        Anthropic["Anthropic"]
        Google["Google"]
        Local["Local/Ollama"]
    end

    subgraph Tasks["AI Tasks"]
        TutorTask["Tutor Conversation"]
        OnboardTask["Onboarding Extraction"]
        ExplainTask["Recommendation Explanation"]
        QuestionGen["Question Generation"]
        ContentTag["Content Tagging"]
        MentorInsight["Mentor Insights"]
    end

    Tasks --> AIGateway
    AIGateway --> ModelRouter
    ModelRouter --> Providers

    subgraph Guardrails["Guardrails"]
        PromptInjection["Prompt Injection Detection"]
        OutputValidation["Output Validation"]
        PIIFilter["PII Filter"]
        TenantIsolation["Tenant Isolation"]
    end

    AIGateway --> Guardrails
```

## Data Model Overview

```mermaid
erDiagram
    USERS ||--o{ MEMBERSHIPS : has
    ORGANIZATIONS ||--o{ MEMBERSHIPS : has
    USERS ||--o| LEARNER_PROFILES : has
    LEARNER_PROFILES ||--o{ LEARNER_GOALS : sets
    LEARNER_PROFILES ||--o{ MASTERY_STATES : has

    SKILLS ||--o{ SKILL_RELATIONSHIPS : has
    SKILLS ||--o{ MASTERY_STATES : measured_by
    CAREER_ROLES ||--o{ ROLE_SKILLS : requires

    COURSES ||--o{ MODULES : contains
    MODULES ||--o{ CHAPTERS : contains
    CHAPTERS ||--o{ LESSONS : contains
    LESSONS ||--o{ RESOURCES : includes

    ASSESSMENTS ||--o{ QUESTIONS : contains
    QUESTIONS ||--o{ QUESTION_SKILLS : maps_to
    ASSESSMENTS ||--o{ ATTEMPTS : taken_as

    LEARNING_PATHS ||--o{ LEARNING_PATH_NODES : contains
    LEARNING_PATH_NODES ||--o{ MILESTONES : targets

    RECOMMENDATIONS ||--o{ RECOMMENDATION_REASONS : explained_by
    RECOMMENDATIONS ||--o{ RECOMMENDATION_FEEDBACK : receives

    XP_EVENTS }o--|| USERS : awarded_to
    STREAKS }o--|| USERS : tracked_for
    BADGES }o--|| USERS : earned_by
```

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 + React 19 | Server/Client rendering |
| UI Components | shadcn/ui + Tailwind CSS | Design system |
| Backend | FastAPI + Python | API server |
| ORM | SQLAlchemy 2.x | Database access |
| Database | PostgreSQL 16 + pgvector | Primary storage + vectors |
| Cache | Redis 7 | Caching + background jobs |
| API Gateway | Apache APISIX | Routing, auth, rate limiting |
| Search | PostgreSQL FTS + pgvector | Hybrid search |
| AI | OpenAI/Anthropic/Google | LLM capabilities |
| Monorepo | pnpm + Turborepo | Package management |
| Linting | Biome | Format + lint |
| Testing | pytest + Playwright | Backend + E2E |

## Multi-Tenancy

Row-level tenant isolation with `tenant_id` on all tenant-owned tables. Every data access path validates tenant + user + role + resource + action. Frontend never used as authorization boundary.

## Security Boundaries

```
Frontend ──╳──> Database (never direct)
Student  ──╳──> Mastery Scores (cannot modify)
Teacher  ──╳──> Other Tenant Data (isolated)
AI       ──╳──> Authorization Bypass (not allowed)
Recommendations ──╳──> Grade Modification (not allowed)
```
