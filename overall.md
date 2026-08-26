# Build a Production-Grade AI-Powered Personalized Learning Platform

## 1. Your Role

Act as a principal software architect, senior full-stack engineer, ML engineer, AI engineer, UX/product designer, learning-science specialist, security engineer, and DevOps engineer working together as one engineering team.

Design and build a **production-quality AI-powered personalized learning platform** that combines:

* conversational AI
* learner profiling
* adaptive diagnostics
* skill-gap analysis
* prerequisite-aware learning paths
* course/resource recommendation
* knowledge tracing / mastery estimation
* adaptive assessments
* personalized revision
* projects and practical assignments
* gamification
* academic management
* course management
* exam management
* teacher/mentor workflows
* student progress analytics
* administrator and super-administrator controls

The product must feel like a modern combination of:

* Duolingo-style engagement
* Coursera/Udemy-style course management
* Khan Academy-style mastery
* Notion-like organization
* modern AI copilot experiences
* enterprise-grade LMS administration

Do **not** create a generic LMS with an AI chatbot added on top.

The core product must be an **adaptive learning operating system** whose main purpose is:

> Understand the learner, determine what they already know, determine what they need to know, select the best next learning activity, explain why it was selected, measure whether it worked, and continuously adapt the learning path.

---

# 2. Core Product Vision

A learner should be able to say:

> "I want to become a backend engineer and get job-ready in 6 months. I know basic Python and SQL, but I am weak in databases, system design and APIs. I can study 1 hour a day, 5 days a week, and I prefer short videos and hands-on projects."

The platform must automatically:

1. Understand the learner's goal.
2. Extract target skills.
3. Estimate current skills.
4. Identify gaps.
5. Identify prerequisite relationships.
6. Run a diagnostic assessment when confidence is low.
7. Skip topics the learner has already mastered.
8. Recommend the smallest useful next learning unit.
9. Build a roadmap.
10. Mix courses, chapters, videos, readings, quizzes, coding tasks, projects, reviews and exams.
11. Explain every important recommendation.
12. Adapt the roadmap from new assessment results.
13. Detect struggle, boredom, inactivity or disengagement.
14. Change difficulty, content format, pacing and revision frequency.
15. Continuously recalculate the next best action.

The experience must never feel like:

> "Here are 20 courses. Good luck."

It should feel like:

> "Here is the exact next thing you should do, why you should do it, and what you can skip."

---

# 3. Non-Negotiable Architecture

Use a **monorepo + modular architecture**.

Do NOT create a distributed microservice architecture unnecessarily.

Start with a **modular FastAPI backend / modular monolith**, with bounded contexts that can later be extracted into services if scale requires it.

Use:

### Frontend

* Next.js 16.x
* App Router
* TypeScript strict mode
* React 19+
* Turbopack
* Server Components where appropriate
* Client Components only when interactivity requires them
* shadcn/ui
* Tailwind CSS
* accessible components
* responsive/mobile-first design
* PWA-friendly architecture where appropriate

### Backend

* Python
* FastAPI
* Pydantic
* SQLAlchemy 2.x
* Alembic
* PostgreSQL
* pgvector
* Redis for caching/queues/session-adjacent workloads where appropriate
* background workers for asynchronous jobs
* OpenAPI
* Swagger UI
* ReDoc

### API Gateway

Use Apache APISIX as the external API gateway.

Gateway responsibilities:

* TLS termination where deployment architecture allows
* authentication integration
* authorization enforcement boundaries
* routing
* rate limiting
* request correlation IDs
* security headers
* observability
* API versioning
* AI/LLM traffic governance
* abuse prevention
* request size limits
* timeout policies
* circuit breaking
* traffic splitting where required

Never expose internal backend services directly to public clients when the gateway is intended to be the public boundary.

### Database

Primary database:

* PostgreSQL

Use:

* relational tables for core application data
* JSONB only where flexibility is genuinely useful
* pgvector for semantic retrieval
* PostgreSQL full-text search for lexical retrieval
* HNSW for vector search where appropriate
* hybrid retrieval combining semantic similarity + lexical relevance + structured filters

Do not create a separate vector database unless there is a demonstrated scale requirement.

### Monorepo

Use a workspace/monorepo structure such as:

```text
apps/
  web/
  admin/
  mentor/
  api/

packages/
  ui/
  config/
  types/
  api-client/
  validation/
  analytics/
  auth/
  learning-domain/
  recommendation/
  ai/
  telemetry/

backend/
  app/
    modules/
      identity/
      learners/
      skills/
      content/
      courses/
      learning_paths/
      assessments/
      exams/
      recommendations/
      mastery/
      gamification/
      academic/
      mentors/
      analytics/
      notifications/
      ai_assistant/
      search/
      administration/

ml/
  data/
  features/
  models/
  training/
  evaluation/
  inference/

infra/
  apisix/
  docker/
  monitoring/
  migrations/

docs/
  architecture/
  product/
  api/
  ai/
  ml/
  security/
```

Adjust the exact structure only when there is a strong architectural reason.

---

# 4. Package/Repository Principles

Use:

* pnpm workspaces
* Turborepo
* Biome
* Husky
* TypeScript project references where beneficial
* strict dependency boundaries
* shared package contracts
* reusable UI package
* generated API client from OpenAPI
* centralized environment validation
* conventional commit-compatible workflow
* CI checks before merge

Use Biome for formatting/linting in JavaScript/TypeScript.

Use Husky hooks for:

* format/lint validation
* type checking where reasonable
* commit-message validation
* preventing accidental secrets
* fast changed-file validation

Do not make pre-commit hooks painfully slow.

---

# 5. User Roles

Implement robust RBAC and authorization.

Roles:

## Super Admin

Full platform control.

Capabilities:

* tenant/platform management
* system configuration
* feature flags
* AI provider configuration
* model configuration
* global analytics
* billing/configuration if enabled
* security settings
* audit logs
* role/permission policy
* content governance
* platform health
* data governance
* impersonation with strict auditing
* emergency controls

## Admin / Academic Administrator

Capabilities:

* institution management
* students
* teachers
* mentors
* departments
* programs
* academic terms
* courses
* batches/classes
* enrollment
* schedules
* exams
* grading
* certificates
* reports
* content moderation
* academic configuration

## Teacher

Capabilities:

* create/manage courses
* create modules/chapters
* create lessons
* upload videos/documents
* create assessments
* create assignments
* grade work
* view learner progress
* identify struggling learners
* send interventions
* manage cohorts
* create learning plans
* view analytics

## Mentor

Capabilities:

* assigned learners
* learner goals
* learner progress
* AI-generated learner insights
* intervention recommendations
* feedback
* mentoring sessions
* customized plans
* notes
* milestone review

## Student / Learner

Capabilities:

* onboarding
* AI conversation
* diagnostics
* courses
* learning path
* assessments
* projects
* progress
* achievements
* gamification
* calendar
* revision
* profile/preferences
* goals
* feedback
* certificates

---

# 6. Multi-Tenancy

Design the platform so it can support:

* standalone learners
* schools
* colleges
* universities
* bootcamps
* corporate learning teams
* coaching/mentoring organizations

Use tenant-aware authorization.

Tenant isolation must be enforced at the data-access layer, not only in the UI.

Every data access path involving tenant-owned resources must validate:

* tenant
* user
* role
* resource
* action

Never rely on frontend hiding of buttons as authorization.

---

# 7. Learner Profile Engine

Create a rich learner profile.

Profile dimensions:

### Identity

* name
* age range where appropriate
* language
* timezone
* locale

### Learning Preferences

* preferred content type
* preferred study duration
* available days
* preferred difficulty
* preferred learning time
* preferred language
* visual/text/audio preference
* project-oriented vs theory-oriented
* independent vs mentor-supported

### Motivation

Infer and explicitly collect:

* career goal
* academic goal
* certification goal
* curiosity goal
* financial goal
* job-switch goal
* personal goal

### Experience

* education
* professional experience
* prior technologies
* certifications
* completed courses
* self-reported skills

### Behavioral Signals

Collect meaningful learning signals:

* time spent
* lesson completion
* drop-off
* replay
* pause
* retries
* quiz results
* question-level performance
* hint usage
* assignment performance
* project completion
* revision behavior
* streak behavior
* skipped content
* preferred formats
* feedback
* confidence

Do not use behavioral data as a simplistic measure of intelligence.

---

# 8. Conversational Onboarding

Create an AI conversational onboarding experience.

Example:

AI:

> What do you want to achieve?

Learner:

> I want to become a machine learning engineer.

AI should follow up intelligently:

* current experience
* current skills
* target timeline
* available study time
* preferred learning format
* target job/role
* project interests
* preferred difficulty
* constraints

Do not force users through a giant form.

Use progressive profiling.

The AI should ask only the questions that materially improve personalization.

Convert the conversation into structured learner data.

Example conceptual output:

```json
{
  "goal": "Become job-ready as a machine learning engineer",
  "target_role": "ML Engineer",
  "time_horizon_weeks": 24,
  "hours_per_week": 6,
  "known_skills": [
    "Python",
    "basic statistics"
  ],
  "unknown_or_uncertain_skills": [
    "linear algebra",
    "machine learning",
    "deployment",
    "MLOps"
  ],
  "preferences": {
    "video_length": "short",
    "hands_on": true,
    "projects": "high"
  }
}
```

The AI must distinguish:

* user-stated facts
* inferred attributes
* uncertain attributes

Never present an inference as a known fact.

---

# 9. Skill Graph

Create a structured skill ontology / knowledge graph.

Entities:

* skill
* subskill
* concept
* competency
* prerequisite
* related skill
* course
* lesson
* chapter
* project
* assessment
* exam
* learning resource
* career role

Relationships:

```text
Skill A -> prerequisite of -> Skill B
Skill A -> related to -> Skill C
Course X -> teaches -> Skill A
Lesson Y -> teaches -> Skill A
Assessment Z -> measures -> Skill A
Project P -> demonstrates -> Skill B
Career Role R -> requires -> Skill B
```

Example:

```text
Python
  -> functions
  -> OOP
  -> modules
  -> async programming

Backend Development
  -> HTTP
  -> REST APIs
  -> databases
  -> authentication
  -> caching
  -> testing
  -> deployment

System Design
  -> scalability
  -> queues
  -> caching
  -> distributed systems
```

Learning path generation MUST use prerequisite relationships.

Do not generate random course sequences.

---

# 10. Diagnostic Assessment Engine

Before building a long learning path, estimate existing knowledge.

The diagnostic engine should:

1. infer known skills from history
2. examine completed course results
3. identify uncertainty
4. generate adaptive questions
5. test prerequisite concepts
6. estimate mastery
7. identify misconceptions
8. skip mastered material
9. recommend remediation where needed

Support:

* multiple choice
* multiple select
* true/false
* coding
* SQL
* short answer
* matching
* ordering
* scenario questions
* project-based evaluation

Diagnostic questions should adapt to performance.

Example:

```text
If learner answers basic question correctly
    -> increase difficulty

If learner answers advanced question incorrectly
    -> test prerequisite concept

If prerequisite is strong
    -> retry target skill

If prerequisite is weak
    -> generate remediation
```

---

# 11. Mastery / Knowledge Model

Build a learner knowledge state.

At minimum, track:

```text
skill_id
mastery_score
confidence
evidence_count
last_assessed_at
last_practiced_at
retention_estimate
difficulty_estimate
```

Mastery must be evidence-based.

Do not set:

```text
completed course = mastered
```

Instead combine:

* assessment performance
* repeated retrieval success
* practical application
* recency
* difficulty
* consistency
* project evidence

Start with a transparent rule-based/Bayesian mastery model.

Then create an ML-ready interface for:

* Bayesian Knowledge Tracing
* Deep Knowledge Tracing
* transformer/attention-based knowledge tracing
* item response models
* learner performance prediction

Use ML only when there is enough validated data.

Do not deploy a complex deep model merely for marketing.

---

# 12. Recommendation Engine

Build a hybrid recommendation system.

Do NOT use an LLM as the only recommender.

Use multiple signals:

### Content relevance

* skill match
* goal match
* prerequisite match
* semantic similarity
* lexical relevance

### Learner relevance

* current mastery
* skill gap
* learning style
* preferred resource type
* difficulty
* time availability

### Behavioral relevance

* completion rate
* historical engagement
* feedback
* successful resource patterns

### Contextual relevance

* current learning goal
* current milestone
* time available today
* upcoming exam
* deadline
* inactivity
* mentor intervention

### Quality

* rating
* completion success
* teacher quality
* freshness
* content reliability

### Diversity

Avoid recommending five nearly identical resources.

---

# 13. Recommendation Scoring

Create a transparent scoring pipeline.

Example conceptual score:

```text
recommendation_score =
    goal_match
  + skill_gap_match
  + prerequisite_fit
  + mastery_fit
  + preference_fit
  + difficulty_fit
  + time_fit
  + historical_success
  + content_quality
  + novelty
  - redundancy
  - prerequisite_violation
```

Use configurable weights.

Store recommendation reasons.

Every recommendation must have machine-readable evidence.

Example:

```json
{
  "resource_id": "course_123",
  "score": 0.87,
  "reasons": [
    "fills_missing_skill: REST API design",
    "prerequisites_already_mastered",
    "matches_preference: short_video",
    "fits_available_time: 18 minutes"
  ]
}
```

---

# 14. Personalized Learning Path Generator

Generate a structured DAG, not a flat list.

A learning path should contain:

```text
Goal
  -> Milestone
      -> Skill Cluster
          -> Concept
              -> Learning Activity
                  -> Assessment
                      -> Practice
                          -> Review
```

Each node may be:

* short video
* article
* interactive lesson
* micro-learning
* quiz
* coding challenge
* flashcard
* assignment
* project
* mentor session
* exam
* review session

Each path must contain:

* prerequisites
* milestones
* estimated duration
* difficulty
* skill coverage
* assessments
* expected outcomes
* skip rules
* remediation rules
* review schedule

---

# 15. Adaptive Skip Logic

This is a critical feature.

If the learner demonstrates mastery:

```text
Do not force the learner to consume the chapter.
```

Instead:

```text
diagnostic
    -> mastery confirmed
    -> skip chapter
    -> move to challenge/practical application
```

For partially mastered material:

```text
skip full chapter
    -> recommended micro-lesson
    -> short retrieval quiz
    -> continue
```

For weak prerequisite:

```text
pause target topic
    -> remediation
    -> reassessment
    -> return to target topic
```

The learner should clearly see:

> "Skipped because you already demonstrated mastery."

This creates a feeling of intelligent personalization.

---

# 16. Micro-Learning System

Support multiple learning durations:

* 2 minutes
* 5 minutes
* 10 minutes
* 15 minutes
* 25 minutes
* 45 minutes
* deep work session

The system should detect:

> "You only have 8 minutes today."

Then produce an appropriate session.

Example:

```text
8-minute learning session

1 min — review
3 min — short video
2 min — retrieval quiz
2 min — challenge
```

Never show a 2-hour chapter when the learner explicitly has 8 minutes.

---

# 17. Short-Video-First Learning

For beginner and disengaged learners, support a:

> "Just start" mode.

When a learner does not feel like learning:

* one short video
* one simple question
* one tiny interaction
* immediate positive feedback
* one visible progress movement

Avoid requiring a large commitment upfront.

Use a "minimum viable learning session."

---

# 18. Duolingo-Inspired Motivation System

Create a highly engaging but academically meaningful gamification layer.

Features:

### XP

Award XP for meaningful behaviors:

* completing learning activity
* passing retrieval quiz
* completing project
* improving mastery
* helping peers
* maintaining learning consistency

Do not award large rewards for meaningless clicking.

### Streaks

Support:

* daily streak
* flexible streak freeze
* recovery
* weekly goal

Avoid making a missed day feel catastrophic.

### Levels

Examples:

```text
Novice
Explorer
Builder
Practitioner
Advanced
Expert
```

### Skill badges

Examples:

```text
Python Foundations
SQL Explorer
API Builder
Debugging Specialist
System Design Practitioner
```

### Quests

Examples:

```text
Finish your first API
Solve 5 debugging challenges
Complete 3 SQL tasks
Build your first backend project
```

### Daily Missions

Generate personalized missions based on current weaknesses.

Example:

> Today's 12-minute mission:
> Review joins → solve 3 SQL questions → complete 1 mini challenge.

### XP multipliers

Use carefully.

Never make monetization or engagement more important than actual learning.

---

# 19. Motivation Engine for Learners Who "Don't Like Studying"

Design specifically for low-motivation learners.

Do NOT assume they are lazy.

Possible reasons:

* overwhelmed
* poor prior experience
* content too difficult
* content too boring
* unclear goal
* no immediate relevance
* cognitive overload
* sessions too long
* lack of confidence
* no visible progress

The system should diagnose the likely issue and adapt.

Possible modes:

### Tiny Win Mode

5 minutes.

### Game Mode

Quests, XP and challenges.

### Visual Mode

Video + interactive diagrams.

### Project Mode

Skip theory-heavy content and learn through building.

### Coach Mode

AI mentor encourages and guides.

### Accountability Mode

Mentor/check-in support.

### Exam Mode

Focused revision.

### Career Mode

Job-oriented skills/projects.

### Sprint Mode

Intensive short-term path.

---

# 20. AI Learning Assistant

Create a conversational AI tutor.

The AI should:

* explain concepts
* answer learner questions
* give hints
* provide examples
* simplify explanations
* generate practice questions
* review answers
* explain mistakes
* recommend next actions
* summarize progress
* explain recommendations
* motivate appropriately
* help with projects

The tutor should NOT blindly give the final answer.

Use educational scaffolding:

```text
Hint
  -> more specific hint
    -> worked example
      -> partial solution
        -> full explanation
```

For coding questions, encourage reasoning before revealing the answer.

---

# 21. Explainable AI Recommendations

Every important recommendation should support:

> Why am I seeing this?

Examples:

> Recommended because:
>
> * You have mastered Python basics.
> * You are weak in REST API design.
> * REST APIs are a prerequisite for your backend goal.
> * This lesson matches your preferred 15-minute sessions.
> * You performed well with hands-on exercises previously.

Also provide:

> Why not this?

Example:

> We did not recommend Advanced Kubernetes yet because Docker networking and container basics are not sufficiently mastered.

Explainability should come from system evidence, not fabricated LLM explanations.

---

# 22. Feedback-Driven Adaptation

After an activity, ask lightweight feedback:

```text
Too easy
Right level
Too hard

Helpful
Not helpful

I prefer:
Video
Reading
Practice
Project
```

Use feedback in the recommender.

Also allow:

> "I don't want videos."

Immediately update preferences.

Allow:

> "This course is boring."

Record content feedback and adjust future recommendations.

---

# 23. Learning Session Engine

Create a "Today's Learning" engine.

Each day generate:

```text
Today's goal
Estimated time
Current milestone
1 primary task
1 review task
1 challenge
1 optional task
```

Example:

```text
TODAY — 24 minutes

🔥 Main quest
Build a REST endpoint

🧠 Review
HTTP status codes

🎯 Challenge
Fix 2 broken API responses

🏆 Reward
+90 XP
Backend Builder progress +6%
```

---

# 24. Spaced Repetition / Retrieval

Implement a review scheduler.

Use:

* spaced practice
* retrieval practice
* cumulative review
* interleaving
* adaptive difficulty

Review scheduling should depend on:

* mastery
* confidence
* time since last review
* prior failures
* difficulty
* importance of skill
* retention estimate

Do not make every learner review at the same interval.

---

# 25. Assessment Engine

Assessment is a first-class domain.

Support:

* question bank
* question tagging
* skills
* difficulty
* objectives
* randomization
* adaptive exams
* timed tests
* practice tests
* diagnostic tests
* assignments
* coding evaluation
* grading
* rubrics
* attempts
* hints
* explanations

Question metadata:

```text
skill
subskill
difficulty
blooms_level
estimated_time
question_type
learning_objective
prerequisites
```

---

# 26. Exam Management

Implement:

* exam creation
* sections
* question pools
* random selection
* scheduling
* exam windows
* attempts
* time limits
* anti-cheating hooks
* grading
* partial credit
* manual grading
* AI-assisted grading with teacher approval
* feedback
* result publishing
* analytics

AI grading must never silently override teacher-controlled academic policy.

---

# 27. Course Management

Course model:

```text
Course
 ├── Course metadata
 ├── Modules
 │    ├── Chapters
 │    │    ├── Lessons
 │    │    ├── Videos
 │    │    ├── Readings
 │    │    ├── Exercises
 │    │    └── Assessments
 │    ├── Projects
 │    └── Exams
```

Support:

* drafts
* publishing
* versions
* prerequisites
* tags
* skill mapping
* difficulty
* duration
* instructors
* cohorts
* enrollment
* completion
* certificates

---

# 28. Academic Management

Support:

* institutions
* departments
* programs
* semesters
* academic years
* courses
* sections
* batches
* teachers
* mentors
* students
* enrollment
* attendance
* grades
* exams
* results
* assignments
* certificates

Keep academic data separate from generic content where useful.

---

# 29. Mentor Dashboard

Mentors should see:

### Overview

* active learners
* at-risk learners
* inactive learners
* improving learners
* upcoming interventions

### Learner Details

* goals
* skill profile
* mastery
* learning path
* activity
* strengths
* weaknesses
* recommended interventions

Example AI insight:

> "Arjun has completed 76% of the backend roadmap but has repeatedly failed database normalization assessments. Recommend a 20-minute remediation session before continuing to advanced ORM topics."

The mentor must be able to:

* accept
* reject
* modify

AI recommendations.

AI should support humans rather than replace teachers/mentors.

---

# 30. Teacher Dashboard

Teacher dashboard:

* courses
* content
* assessments
* learner progress
* skill performance
* cohort analytics
* difficult questions
* content effectiveness
* dropout points
* assignment quality
* AI insights

Teacher insight example:

> "42% of learners fail the dependency injection lesson. Learners who complete the prerequisite quiz score 23% higher."

---

# 31. Student Dashboard

Build a beautiful learner-first dashboard.

Sections:

### Hero

```text
Good evening, Priya 👋

You're 68% toward Backend Engineer.

Today's best next step:
Build a REST API endpoint — 18 min
```

### Skill map

Visualize:

```text
Python       ██████████ 92%
SQL          ████████░░ 78%
APIs         ██████░░░░ 61%
Testing      ████░░░░░░ 43%
Docker       ██░░░░░░░░ 22%
```

### Continue learning

### Today's mission

### Upcoming milestones

### Review queue

### Projects

### Streak

### XP

### Recommended next action

---

# 32. Career Goal Mode

Allow learners to select:

* Backend Engineer
* Frontend Engineer
* Full Stack Developer
* Data Analyst
* Data Scientist
* ML Engineer
* AI Engineer
* DevOps Engineer
* Cloud Engineer
* Product Manager
* Cybersecurity Analyst
* UI/UX Designer
* custom goal

A career profile maps:

```text
Career Goal
   ↓
Required Competencies
   ↓
Skill Graph
   ↓
Current Learner Mastery
   ↓
Gap Analysis
   ↓
Learning Path
   ↓
Projects
   ↓
Assessment
   ↓
Portfolio / Certificate
```

---

# 33. Project-Based Learning

Every major skill cluster should have practical projects.

Example:

```text
Skill:
REST APIs

Micro Practice:
Create GET endpoint

Mini Project:
Todo API

Milestone Project:
Authentication-enabled API

Capstone:
Production-style backend service
```

Project difficulty should adapt.

Projects should map to:

* skills
* competencies
* learning objectives
* career outcomes

---

# 34. Content Intelligence

Every learning resource should be enriched.

Store:

```text
resource_id
title
summary
skills
subskills
prerequisites
difficulty
duration
format
language
learning_objectives
embedding
quality_score
version
```

Use AI to help instructors create metadata, but keep human review.

---

# 35. AI Content Ingestion

Teachers should be able to upload:

* PDF
* DOCX
* PPTX
* video
* transcript
* URL
* markdown
* plain text

The ingestion system should:

1. parse content
2. chunk it
3. extract concepts
4. extract skills
5. identify prerequisites
6. generate summaries
7. generate questions
8. generate flashcards
9. generate metadata
10. create embeddings
11. flag uncertain extraction
12. allow human approval

Do not automatically publish AI-generated academic content without review.

---

# 36. Search and Retrieval

Implement hybrid search:

```text
keyword search
+
full-text search
+
vector semantic search
+
metadata filters
+
skill filters
+
learner context
```

Return ranked resources.

Do not depend exclusively on vector similarity.

---

# 37. AI Architecture

Separate AI concerns.

Recommended conceptual layers:

```text
AI Gateway
    ↓
Model Router
    ↓
AI Orchestration
    ↓
Specialized Agents/Services
```

Possible AI modules:

```text
Profile Extraction
Recommendation Explanation
Tutor
Assessment Generator
Question Generator
Content Tagging
Content Summarization
Learning Path Planner
Mentor Copilot
Teacher Copilot
Analytics Narrator
```

Do not make everything an autonomous agent.

Prefer deterministic workflows where the task is deterministic.

Use LLMs for:

* natural language understanding
* explanation
* summarization
* content transformation
* conversational interaction
* hypothesis generation

Use deterministic/ML systems for:

* scoring
* authorization
* progress calculations
* prerequisite enforcement
* grade calculations
* completion rules
* recommendation constraints

---

# 38. AI Guardrails

The AI layer must include:

* prompt injection protection
* input validation
* output validation
* structured output schemas
* tool allowlists
* tenant isolation
* permission checks
* sensitive-data filtering
* model timeout
* token budgets
* rate limits
* audit logs
* AI request IDs
* model/version tracking
* fallback behavior

Never let an LLM directly execute unrestricted database or administrative operations.

Every tool call must be authorized independently.

---

# 39. AI Answer Grounding

For factual academic questions:

Prefer:

```text
approved platform content
+
course material
+
trusted resource sources
+
retrieved knowledge
```

The assistant should distinguish:

* platform content
* retrieved source
* generated explanation
* uncertain information

Never fabricate course policy, grades, academic records or platform state.

---

# 40. Recommendation Feedback Loop

Build the recommendation system as a closed loop:

```text
Learner State
     ↓
Candidate Generation
     ↓
Constraint Filtering
     ↓
Ranking
     ↓
Recommendation
     ↓
Learner Action
     ↓
Outcome
     ↓
Feedback
     ↓
Learner State Update
     ↓
Next Recommendation
```

This loop is the heart of the product.

---

# 41. ML Platform

Create an ML-ready architecture.

Initial models can use:

* logistic regression
* gradient boosting
* ranking models
* Bayesian models
* collaborative filtering where appropriate

Future models:

* knowledge tracing
* learning-to-rank
* contextual bandits
* sequence models
* deep knowledge tracing
* transformer-based learner modeling

Track:

* model version
* training data version
* feature version
* evaluation metrics
* inference version
* experiment ID

Do not train models on raw personally identifiable information unless absolutely necessary and governed.

---

# 42. Recommendation Evaluation

Create offline evaluation metrics:

* Precision@K
* Recall@K
* NDCG@K
* MRR
* MAP
* coverage
* diversity
* novelty
* calibration
* prerequisite violations
* skill-gap reduction
* learner completion
* learning gain

More important than CTR:

```text
Did the recommendation improve learning?
```

Measure:

* mastery gain
* retention
* assessment performance
* project success
* milestone completion

Optimize engagement and learning together.

Do not optimize only clicks.

---

# 43. Experimentation

Create feature flags and experimentation infrastructure.

Support:

* A/B tests
* recommendation strategy experiments
* onboarding experiments
* motivation experiments
* content format experiments

Example:

```text
Experiment:
Short-video-first onboarding

Variant A:
Traditional onboarding

Variant B:
3-minute mission

Metrics:
Activation
First-session completion
7-day retention
Mastery gain
```

Never run educational experiments without clear guardrails.

---

# 44. Gamification Intelligence

Do not give the same quests to everyone.

Generate personalized quests based on:

* weaknesses
* current path
* missed reviews
* goals
* engagement state
* available time

Example:

```text
Learner weak in SQL joins

Quest:
"Join Master"

1. Watch 4-minute explanation
2. Solve 3 questions
3. Debug one broken SQL query
4. Earn badge
```

---

# 45. Anti-Burnout Design

The system should recognize:

* excessive study streak
* repeated failures
* declining engagement
* session fatigue
* repeated skipping
* unusually long inactive periods

Possible intervention:

> "You've been studying heavily for 6 days. Today I recommend a 10-minute review rather than a new chapter."

---

# 46. Accessibility

Target WCAG 2.2 AA.

Requirements:

* keyboard navigation
* semantic HTML
* screen-reader support
* accessible forms
* captions
* transcripts
* color-independent meaning
* focus states
* adequate target sizes
* reduced-motion support
* accessible authentication
* high-quality error states

Do not make gamification inaccessible.

---

# 47. UI / UX Direction

Visual style:

* modern
* friendly
* premium
* playful
* professional
* clean
* optimistic

Avoid making the interface look like:

* old enterprise LMS
* dense university administration software
* generic AI dashboard
* crypto dashboard

Learner UX should feel closer to:

```text
Duolingo
+
Linear
+
Notion
+
modern AI assistant
```

Admin UX can be denser and more operational.

---

# 48. Key Screens

Build at minimum:

## Public

* landing page
* pricing placeholder
* features
* about
* sign in
* sign up

## Student

* onboarding
* AI goal conversation
* diagnostic
* dashboard
* learning path
* daily mission
* lesson player
* quiz
* exam
* project workspace
* skill map
* review center
* achievements
* profile
* AI tutor

## Mentor

* dashboard
* learner list
* learner profile
* intervention center
* analytics
* mentoring notes

## Teacher

* dashboard
* courses
* course builder
* lesson builder
* question bank
* assessments
* exams
* cohorts
* analytics
* AI teaching assistant

## Admin

* dashboard
* users
* tenants
* programs
* courses
* enrollments
* academics
* exams
* analytics
* moderation
* settings

## Super Admin

* global dashboard
* tenant management
* AI provider management
* system configuration
* audit logs
* feature flags
* model configuration
* observability
* security controls

---

# 49. Lesson Player

The lesson player must be adaptive.

Example:

```text
Lesson: REST APIs

[Short Video — 6 min]

Before continuing:
[2-question retrieval check]

Result:
92% mastery

AI:
"You have already demonstrated the basics.
Skip the next introductory section?"

[Skip]
[Review]
[Continue]
```

This is a key differentiator.

---

# 50. Adaptive Path UX

Show:

```text
YOUR PATH

✓ Python Foundations
✓ HTTP Basics
↗ REST APIs       ← Current
○ Authentication
○ Databases
○ Testing
○ Deployment

Current milestone:
Build your first authenticated API
```

Allow learners to understand:

* where they are
* why they are there
* what comes next
* what they skipped
* what they need to improve

---

# 51. Data Model

Design a normalized schema containing at least:

### Identity

* users
* roles
* permissions
* organizations
* memberships
* sessions
* audit_logs

### Learner

* learner_profiles
* learner_preferences
* learner_goals
* learner_interests
* learner_skills
* learner_skill_evidence

### Skills

* skills
* skill_relationships
* competencies
* career_roles
* role_skills

### Content

* courses
* modules
* chapters
* lessons
* resources
* videos
* projects
* learning_activities

### Assessments

* assessments
* questions
* question_options
* question_skills
* attempts
* responses
* grades
* rubrics

### Learning

* enrollments
* learning_paths
* learning_path_nodes
* milestones
* learner_activity
* learning_sessions
* progress_events
* review_items

### Mastery

* mastery_states
* mastery_evidence
* skill_assessments
* knowledge_traces

### Recommendations

* recommendation_candidates
* recommendations
* recommendation_reasons
* recommendation_feedback
* ranking_events

### Gamification

* xp_events
* levels
* achievements
* badges
* quests
* streaks
* rewards

### Mentoring

* mentor_assignments
* mentor_notes
* interventions
* check_ins

### Academics

* institutions
* departments
* programs
* terms
* classes
* enrollments
* attendance
* academic_results

### AI

* conversations
* messages
* tool_calls
* ai_runs
* model_versions
* prompts
* evaluations

---

# 52. Event Tracking

Implement event-based learning analytics.

Track events such as:

```text
lesson_started
lesson_completed
video_started
video_completed
video_replayed
question_answered
quiz_started
quiz_completed
assessment_completed
project_started
project_completed
resource_skipped
resource_recommended
resource_rejected
recommendation_accepted
recommendation_rejected
goal_created
goal_changed
streak_started
streak_broken
review_completed
mentor_intervention
```

Design event schemas so the system can later support xAPI/Caliper-style analytics integrations.

---

# 53. API Design

Create versioned APIs.

Example:

```text
/api/v1/auth/*
/api/v1/learners/*
/api/v1/goals/*
/api/v1/skills/*
/api/v1/courses/*
/api/v1/content/*
/api/v1/assessments/*
/api/v1/exams/*
/api/v1/learning-paths/*
/api/v1/recommendations/*
/api/v1/mastery/*
/api/v1/reviews/*
/api/v1/gamification/*
/api/v1/mentors/*
/api/v1/teachers/*
/api/v1/admin/*
/api/v1/ai/*
/api/v1/analytics/*
```

Every API should have:

* validation
* authorization
* pagination
* filtering
* sorting
* error schemas
* request IDs
* idempotency where applicable
* consistent response format

Generate the frontend API client from OpenAPI rather than duplicating API types manually.

---

# 54. Security Requirements

Apply OWASP API and GenAI security principles.

Must protect against:

* broken object-level authorization
* broken function-level authorization
* unrestricted resource consumption
* SSRF
* insecure API consumption
* prompt injection
* indirect prompt injection
* sensitive data disclosure
* insecure output handling
* tool abuse
* excessive AI agency

Implement:

* RBAC
* tenant isolation
* resource-level authorization
* secure cookies/tokens
* CSRF protection where applicable
* rate limiting
* request validation
* audit logging
* secret management
* encryption in transit
* encryption at rest where supported
* security headers
* dependency scanning
* secret scanning

---

# 55. Privacy

Treat learner information as sensitive educational data.

Implement:

* consent where applicable
* data minimization
* retention policy
* deletion workflows
* export workflows
* auditability
* role-restricted analytics
* tenant isolation
* AI data-use controls

Never send unnecessary learner PII to third-party LLM providers.

Implement PII minimization before model calls where possible.

---

# 56. Observability

Use:

* structured logs
* metrics
* traces
* correlation IDs
* AI latency metrics
* token usage metrics
* recommendation latency
* database metrics
* queue metrics
* error tracking

Track:

```text
API latency
AI latency
LLM token usage
LLM cost
recommendation generation time
assessment generation time
queue delay
database latency
cache hit rate
error rate
```

Instrument important user journeys.

---

# 57. Reliability

Implement:

* retries
* exponential backoff
* timeouts
* circuit breakers where needed
* idempotency
* background jobs
* dead-letter handling
* graceful degradation

If AI is unavailable:

The platform must still allow:

* course access
* assessments
* progress tracking
* existing learning paths
* static recommendations
* core academic workflows

AI must enhance the platform, not become a single point of failure.

---

# 58. AI Provider Abstraction

Do not hard-code the application to a single LLM.

Create an AI provider abstraction.

Support conceptually:

```text
Provider
 ├── OpenAI-compatible providers
 ├── Anthropic
 ├── Google
 ├── local models
 └── future providers
```

Implement:

* model routing
* fallback
* token limits
* cost tracking
* model selection per task
* structured output
* timeout
* retries

Different tasks may use different models.

Do not automatically use the most expensive model.

---

# 59. Caching

Use caching where appropriate for:

* course metadata
* skill graph
* static recommendation candidates
* public catalog
* expensive aggregation
* AI-safe reusable outputs

Do not cache user-specific sensitive information without correct invalidation and authorization considerations.

---

# 60. Background Jobs

Asynchronous tasks should include:

* embedding generation
* content ingestion
* video processing
* transcript generation
* AI metadata generation
* recommendation recalculation
* analytics aggregation
* mastery recalculation
* notification sending
* report generation
* certificate generation

Do not block request/response cycles on long-running work.

---

# 61. Testing Strategy

Implement:

### Unit tests

* domain logic
* recommendation scoring
* mastery calculations
* prerequisite validation
* gamification rules

### Integration tests

* PostgreSQL
* pgvector
* Redis
* FastAPI
* API Gateway

### Contract tests

Ensure OpenAPI/client/backend compatibility.

### E2E tests

Use Playwright.

Test:

```text
signup
onboarding
goal creation
diagnostic
path generation
learning
quiz
skip flow
recommendation
feedback
gamification
mentor workflow
teacher workflow
admin workflow
```

### AI evaluation

Create deterministic test datasets for:

* hallucination
* prompt injection
* recommendation quality
* explanation accuracy
* tool authorization
* structured output validity

---

# 62. Seed Data

Create realistic seed/demo data.

At minimum:

### Courses

* Python
* JavaScript
* SQL
* Backend Development
* Frontend Development
* Data Science
* Machine Learning
* DevOps
* System Design

### Career paths

* Backend Engineer
* Full Stack Engineer
* Data Analyst
* ML Engineer

### Learners

Create multiple learner personas:

1. beginner
2. experienced developer
3. inconsistent learner
4. exam-focused learner
5. project-focused learner
6. learner who dislikes long videos
7. highly motivated learner
8. learner with substantial prior knowledge

The system should generate visibly different learning paths for each.

---

# 63. Demo Scenario

The demo must make personalization obvious.

Create a learner:

```text
Goal:
Become backend engineer

Timeline:
6 months

Time:
45 minutes/day

Known:
Python
basic SQL
Git

Weak:
HTTP
REST APIs
databases
testing

Preference:
short videos + coding
```

Run diagnostic.

Expected behavior:

```text
Python fundamentals → SKIP
Basic Git → SKIP

HTTP → RECOMMEND
REST APIs → RECOMMEND
SQL joins → QUICK REVIEW
Database design → RECOMMEND
Testing → RECOMMEND
Docker → LATER
Kubernetes → NOT YET
```

Then complete activities and show the roadmap changing.

This adaptive behavior is more important than merely having many screens.

---

# 64. Recommendation Explainability Demo

Show:

```text
Why this recommendation?

✓ Matches your Backend Engineer goal
✓ Fills a current skill gap
✓ Prerequisites are already mastered
✓ Similar lessons worked well for you
✓ Fits your 20-minute study window

Confidence: High
```

---

# 65. "I Don't Want to Study" Demo

Test this conversation:

Learner:

> "I don't feel like studying today."

AI:

```text
No problem.

Let's do a 5-minute mission instead.

🎯 Mission:
Fix one broken API endpoint.

⏱ 5 minutes
🔥 +30 XP
🧠 Improves: REST API debugging
```

After completion:

> "Nice. You made progress without needing a full lesson."

Do not use manipulative language.

---

# 66. Learning Path Recalculation

The path must dynamically change after evidence.

Example:

Initial:

```text
HTTP
REST
Authentication
Databases
Testing
Docker
```

Learner performs extremely well on REST.

System changes:

```text
HTTP
REST      ✓ mastered
Authentication
Databases
Testing
Docker
```

Learner fails database normalization twice.

System changes:

```text
Database fundamentals
    ↓
Normalization remediation
    ↓
3 retrieval questions
    ↓
Reassessment
    ↓
Database design
```

Show the reason.

---

# 67. UX Detail: Never Hide the AI Logic

Important adaptive changes should be explainable.

Example:

> Path updated

> We moved "Database Design" earlier because your assessment showed a stronger-than-expected API foundation and a gap in relational modeling.

This builds trust.

---

# 68. Admin Analytics

Create dashboards for:

### Learning

* active learners
* completion
* mastery
* retention
* skill gaps
* learning time

### Content

* completion by lesson
* drop-off points
* difficult lessons
* ineffective resources
* engagement

### Assessment

* average score
* difficult questions
* discrimination
* skill-level performance

### Recommendation

* recommendation acceptance
* recommendation rejection
* learning gain after recommendation
* recommendation quality

### AI

* usage
* latency
* cost
* errors
* fallback rate
* hallucination evaluation
* safety events

---

# 69. Feature Flags

Create a feature flag framework.

Examples:

```text
adaptive_diagnostics
ai_tutor
ai_generated_quizzes
gamification
contextual_recommendations
knowledge_tracing
mentor_ai_insights
short_video_mode
career_path_mode
```

Allow admins to activate/deactivate features safely.

---

# 70. Design System

Create a centralized design system using shadcn/ui.

Include:

* typography
* colors
* spacing
* buttons
* forms
* cards
* tabs
* dialogs
* drawers
* sheets
* tooltips
* command menu
* tables
* charts
* progress
* badges
* avatars
* timelines
* skill graphs
* roadmaps
* achievement cards
* learning session cards
* quiz components

Create special reusable components:

```text
SkillProgress
LearningPath
Milestone
RecommendationCard
WhyRecommended
DailyMission
StreakCard
XPProgress
MasteryCard
DiagnosticQuestion
ReviewQueue
TutorMessage
AIInsight
ProjectCard
CourseProgress
```

---

# 71. Mobile Experience

The learner experience must be excellent on mobile.

Prioritize:

* daily learning
* video
* quizzes
* flashcards
* AI tutor
* quick challenges
* progress
* streak
* review

Admin/teacher functionality can be optimized for desktop/tablet.

---

# 72. Notifications

Support:

* in-app
* email
* push-ready architecture

Examples:

> Your review queue has 3 concepts.

> Your milestone is 80% complete.

> Your mentor left feedback.

> You have a 12-minute learning mission waiting.

Notifications must be preference-controlled.

Do not spam the learner.

---

# 73. Certificates

Support:

* course certificates
* program certificates
* skill badges
* milestone certificates

Certificates should only be issued based on explicit completion rules.

---

# 74. AI Tutor Memory

The AI tutor may remember learning context, but memory must be structured.

Store:

* learner goal
* preferred explanation style
* recent difficulties
* current course
* current lesson
* recurring misconception

Do not store arbitrary sensitive conversation forever.

Provide privacy controls.

---

# 75. Architecture Boundaries

Enforce strict domain boundaries.

For example:

```text
recommendations
cannot directly modify
grades

AI
cannot bypass
authorization

frontend
cannot directly query
database

teacher
cannot access unrelated
tenant data

student
cannot modify
mastery scores directly
```

Domain rules belong in backend domain services.

---

# 76. Error Handling

Use consistent machine-readable errors:

```json
{
  "error": {
    "code": "LEARNER_NOT_ENROLLED",
    "message": "Learner is not enrolled in this course.",
    "request_id": "req_123"
  }
}
```

Never leak stack traces to users.

---

# 77. Documentation

Create:

```text
README.md
ARCHITECTURE.md
SECURITY.md
CONTRIBUTING.md
DEVELOPMENT.md
DEPLOYMENT.md
AI_ARCHITECTURE.md
ML_ARCHITECTURE.md
DATA_MODEL.md
API_GUIDE.md
```

Include architecture diagrams.

Use Mermaid where useful.

Document:

* bounded contexts
* request flow
* recommendation pipeline
* AI pipeline
* learning-path generation
* authentication
* authorization
* database
* background jobs
* observability

---

# 78. Local Development

Provide:

```text
docker compose up
```

or equivalent developer command to start local infrastructure.

Local environment should include:

* PostgreSQL
* pgvector
* Redis
* APISIX
* backend
* frontend

Provide database migrations and seed data.

One command should make the demo runnable.

---

# 79. Developer Experience

A new developer should be able to:

```text
clone repo
install dependencies
copy env example
start infrastructure
run migrations
seed demo data
start frontend/backend
open app
```

Target a very low setup barrier.

---

# 80. CI/CD

CI should run:

```text
install
format check
lint
type check
unit tests
integration tests
API contract tests
build
security scan
```

Use caching appropriately.

Build only affected packages where possible.

---

# 81. Performance

Target:

* fast initial learner dashboard
* fast course navigation
* streaming AI responses where useful
* async expensive work
* pagination
* optimized database queries
* indexes
* caching
* efficient embeddings
* batched background operations

Never optimize prematurely at the expense of maintainability.

---

# 82. Database Performance

Create appropriate indexes for:

* tenant IDs
* learner IDs
* course IDs
* skill IDs
* enrollment IDs
* timestamps
* status
* composite access paths

Use pgvector indexes for semantic retrieval.

Benchmark retrieval quality rather than assuming approximate search is automatically better.

---

# 83. Recommendation Architecture

Implement these stages explicitly:

```text
1. Learner State Builder

2. Goal Interpreter

3. Skill Gap Analyzer

4. Candidate Generator

5. Prerequisite Filter

6. Mastery Filter

7. Personalization Ranker

8. Diversity/Quality Re-Ranker

9. Path Constraint Solver

10. Recommendation Explanation Generator

11. Feedback Recorder
```

Each stage should be testable independently.

---

# 84. Path Constraint Rules

A candidate learning activity must not be recommended when:

* prerequisite is missing
* learner is clearly below required prerequisite unless remediation is intentionally recommended
* activity does not contribute meaningfully to the current goal
* learner already demonstrated mastery and the activity is redundant
* it exceeds the learner's declared time constraints without explanation

Allow controlled overrides for teacher/mentor/admin.

---

# 85. AI vs Rules

Use this principle:

```text
Rules decide what is allowed.

ML estimates what is likely.

LLM explains and communicates.
```

This should be a foundational architectural principle.

---

# 86. Learning Science Rules

Bake the following into the product:

* retrieval practice
* spaced practice
* interleaving
* mastery-based progression
* prerequisite-aware sequencing
* manageable cognitive load
* frequent feedback
* deliberate practice
* authentic projects
* cumulative review

Do not turn these into marketing claims.

Use them as product design principles.

---

# 87. Quality Gates

Before considering the implementation complete, demonstrate these scenarios.

### Scenario A — Beginner

Learner has almost no prior skills.

Expected:

* diagnostic
* foundations
* short lessons
* progressive difficulty
* frequent encouragement

### Scenario B — Experienced Learner

Learner knows 60% of the content.

Expected:

* substantial skipping
* challenge-based validation
* accelerated path

### Scenario C — Struggling Learner

Repeated failures.

Expected:

* prerequisite investigation
* remediation
* smaller steps
* different teaching format

### Scenario D — Low-Motivation Learner

Expected:

* 5-minute mission
* short content
* visible progress
* engaging interaction
* no guilt-based messaging

### Scenario E — Career Switcher

Expected:

* career gap analysis
* project-focused roadmap
* portfolio-oriented milestones

### Scenario F — Exam Preparation

Expected:

* diagnostic
* exam-weighted revision
* weak-topic prioritization
* practice exam
* final review

---

# 88. Acceptance Criteria

The MVP is NOT considered complete unless the following are demonstrably functional:

* user registration/login
* RBAC
* learner onboarding
* conversational goal creation
* diagnostic assessment
* learner profile
* skill graph
* skill gap analysis
* personalized learning path
* prerequisite logic
* adaptive skip
* recommendation engine
* recommendation explanations
* lesson player
* quizzes
* progress tracking
* gamification
* daily learning mission
* AI tutor
* course management
* exam management
* teacher dashboard
* mentor dashboard
* admin dashboard
* PostgreSQL
* pgvector
* FastAPI
* Swagger/OpenAPI
* APISIX
* monorepo
* Biome
* Husky
* automated tests
* seed data
* Docker/local development
* audit logging
* observability
* responsive UI
* accessibility

---

# 89. MVP Prioritization

Do not attempt to build every future feature before demonstrating the core intelligence.

Prioritize:

## Phase 1

```text
Auth
RBAC
Learner profile
Goal conversation
Skill graph
Course catalog
Diagnostic
Mastery
Recommendation engine
Learning path
Lesson player
Quiz
Progress
AI tutor
Gamification basics
Student dashboard
```

## Phase 2

```text
Teacher
Mentor
Admin
Course builder
Exam management
Projects
Content ingestion
AI-generated assessments
Advanced analytics
```

## Phase 3

```text
Knowledge tracing
advanced ranking
experimentation
contextual recommendations
career intelligence
xAPI/Caliper integrations
advanced mentor insights
advanced ML
```

---

# 90. What NOT To Do

Do not:

* build a generic LMS
* build random course recommendations
* use an LLM as the database
* use an LLM as the only recommender
* hard-code learning sequences
* force already-mastered learners through basic chapters
* award XP for meaningless clicks
* use manipulative engagement mechanics
* expose unrestricted AI tools
* trust frontend authorization
* put all logic into one giant FastAPI file
* create premature microservices
* create a separate vector database without need
* duplicate backend types manually in frontend
* use AI-generated academic content without review
* leak private learner data into AI prompts
* make the AI a single point of failure
* sacrifice accessibility for gamification
* optimize for engagement only

---

# 91. Coding Standards

Write:

* production-quality code
* strongly typed code
* clear domain boundaries
* small modules
* testable functions
* meaningful names
* useful comments only where needed
* defensive validation
* explicit error handling
* secure defaults

Avoid:

* giant files
* magic numbers
* duplicated business logic
* copy/paste architecture
* unnecessary abstractions
* premature generic frameworks

---

# 92. Implementation Workflow

Do not merely describe the solution.

Actually create the implementation.

Work in this order:

### Step 1

Inspect the repository.

### Step 2

Create an architecture decision record.

### Step 3

Create monorepo scaffolding.

### Step 4

Create infrastructure.

### Step 5

Create database schema and migrations.

### Step 6

Implement identity/RBAC.

### Step 7

Implement skill/content domains.

### Step 8

Implement learner profile.

### Step 9

Implement diagnostics and mastery.

### Step 10

Implement recommendation pipeline.

### Step 11

Implement learning-path generation.

### Step 12

Implement student experience.

### Step 13

Implement AI tutor.

### Step 14

Implement gamification.

### Step 15

Implement teacher/mentor/admin workflows.

### Step 16

Add observability/security.

### Step 17

Add tests.

### Step 18

Seed realistic demo data.

### Step 19

Run the end-to-end scenarios.

### Step 20

Fix defects and polish UX.

---

# 93. Required Final Output From The Engineering Agent

At the end, provide:

## Architecture

* final architecture
* major bounded contexts
* data flow
* AI flow
* recommendation flow

## Codebase

* repository structure
* key packages
* important modules

## Database

* schema overview
* migrations
* indexes
* vector strategy

## AI

* model/provider abstraction
* prompts
* tool policies
* evaluation approach
* safety controls

## ML

* feature definitions
* baseline model
* future models
* evaluation

## API

* endpoint inventory
* authentication
* authorization
* OpenAPI

## UX

* screen inventory
* major user journeys

## Security

* threat model
* controls

## Testing

* test strategy
* coverage summary
* critical scenarios

## Demo

Provide a complete demo flow proving:

```text
New learner
    ↓
Goal conversation
    ↓
Diagnostic
    ↓
Skill gap
    ↓
Personalized path
    ↓
Adaptive skip
    ↓
Daily mission
    ↓
Learning activity
    ↓
Assessment
    ↓
Mastery update
    ↓
Recommendation update
    ↓
Gamification
    ↓
Progress dashboard
```

---

# 94. Most Important Product Principle

The platform should always answer these five questions for the learner:

### 1. Where am I?

Current mastery and milestone.

### 2. Where am I going?

Goal and target competency.

### 3. What am I missing?

Skill-gap analysis.

### 4. What should I do now?

One clear next best action.

### 5. Why this?

Transparent evidence-based explanation.

If these five questions are answered exceptionally well, the product is successful.

---

# 95. Final Product Personality

The learner should feel:

> "This platform understands me."

Not:

> "This is another LMS."

The experience should continuously communicate:

> You don't need to learn everything.

> You need to learn what matters next.

> We will help you get there.

Build the system around that principle.


# 96. Smart Attendance, Daily Management, Mobile App & Reward Ecosystem

Extend the platform into a complete **daily learning + attendance + engagement ecosystem**.

The product must support:

* daily attendance
* hourly attendance where required
* OTP-based attendance
* biometric-based attendance
* QR-based attendance
* geolocation-aware attendance where legally/operationally appropriate
* mobile application
* learner daily schedule
* teacher/mentor daily management
* attendance analytics
* attendance-linked rewards
* learning-linked rewards
* streaks
* points
* badges
* leaderboards
* challenges
* incentives
* attendance exceptions
* late/early/absence workflows
* leave management
* parent/guardian notification architecture where applicable
* institution-level attendance policies

Attendance must integrate with the learning engine.

It must NOT simply be a CRUD attendance module.

---

# 97. Attendance Philosophy

Attendance should answer:

> "Did the learner participate meaningfully?"

rather than only:

> "Did the learner physically check in?"

Therefore support two concepts:

### Physical Attendance

Evidence that the learner was present.

Examples:

* OTP
* biometric verification
* QR
* approved device
* geolocation signal

### Learning Attendance / Participation

Evidence that the learner actually engaged.

Examples:

* lesson activity
* quiz participation
* classroom participation
* assignment submission
* practical activity
* teacher confirmation

Keep these concepts separate.

Do not automatically assume:

```text
Physical attendance = Learning completion
```

---

# 98. Attendance Policies

Allow administrators to configure attendance policy per:

* institution
* department
* program
* course
* class
* batch
* session
* teacher
* learner group

Configurable rules:

```text
minimum attendance percentage
late threshold
early departure threshold
grace period
hourly attendance
daily attendance
session attendance
biometric required
OTP required
QR required
location validation
device validation
manual override
absence reason
leave approval
holiday calendar
attendance lock time
```

---

# 99. Daily Attendance

Provide a daily attendance workflow.

Example:

```text
08:55
Class starts

09:00
Attendance opens

09:00–09:10
Learner can check in

09:10–09:20
Late check-in

After 09:20
Absent unless approved
```

The exact thresholds must be configurable.

---

# 100. Hourly Attendance

Support institutions that need attendance by hour/session.

Example:

```text
09:00–10:00
Programming

10:00–11:00
Database Systems

11:00–12:00
System Design

12:00–13:00
Project Lab
```

For each session store:

* session
* teacher
* room
* course
* batch
* start time
* end time
* attendance status
* check-in time
* check-out time
* verification method
* confidence
* exception status

---

# 101. OTP Attendance

Implement secure OTP attendance.

Example:

Teacher:

> Start Attendance

System generates:

```text
482917
```

Student enters OTP.

System validates:

```text
student
+
course
+
session
+
time window
+
OTP
```

OTP requirements:

* short expiration
* single-use where appropriate
* server-generated
* rate limited
* brute-force protection
* replay protection
* audit log
* session binding

Do not place sensitive information inside the OTP.

Do not allow an old OTP to be reused.

---

# 102. QR Attendance

Support QR-based attendance as an alternative.

Teacher displays:

```text
Scan to Check In
[Dynamic QR]
```

QR should be:

* dynamically generated
* short lived
* session-bound
* difficult to replay
* auditable

Do not rely on a permanent static QR code for attendance.

---

# 103. Biometric Attendance

Support biometric authentication using **device/platform biometrics**, preferably through secure native/mobile platform capabilities such as:

* Apple Face ID / Touch ID
* Android biometric authentication
* WebAuthn / passkeys where supported

Do NOT build or store raw facial/fingerprint biometric databases unless there is an explicit legal and architectural requirement.

Prefer:

```text
Device biometric
      ↓
OS secure enclave / trusted biometric system
      ↓
Cryptographic authentication assertion
      ↓
Backend verification
```

The application should receive a cryptographic authentication result rather than raw biometric data.

Attendance verification can then be linked to the authenticated device/session.

Include:

* consent
* fallback authentication
* device registration
* device revocation
* biometric unavailable flow
* lost-device flow
* suspicious-device detection

---

# 104. Multi-Factor Attendance

Allow configurable verification levels.

### Level 1

OTP

### Level 2

QR + authenticated user

### Level 3

Device biometric/passkey

### Level 4

Biometric/passkey + location/session validation

### Level 5

Institution-specific high-assurance workflow

Never force every institution to use the maximum verification level.

---

# 105. Location-Aware Attendance

Where legally appropriate, optionally support:

* GPS/geofence
* Wi-Fi/network verification
* classroom device verification
* approved campus network

Example:

```text
Attendance request
   ↓
Authenticated learner
   ↓
Current session
   ↓
Time validation
   ↓
Optional location validation
   ↓
Optional device validation
   ↓
Attendance accepted
```

Location must be privacy-conscious.

Do not continuously track student location merely to support attendance.

Collect the minimum necessary location information.

---

# 106. Attendance Status Model

Support:

```text
PRESENT
LATE
ABSENT
EXCUSED
LEAVE
PARTIAL
EARLY_EXIT
PENDING_REVIEW
REJECTED
MANUALLY_CORRECTED
```

Store reason and evidence for non-standard statuses.

---

# 107. Attendance Event Model

Create immutable attendance events where possible.

Example:

```json
{
  "student_id": "student_123",
  "session_id": "session_456",
  "event_type": "CHECK_IN",
  "timestamp": "2026-08-24T09:03:00Z",
  "verification_method": "BIOMETRIC",
  "device_id": "device_123",
  "location_status": "VALID",
  "result": "ACCEPTED"
}
```

Do not silently overwrite historical attendance records.

Corrections should create an auditable correction event.

---

# 108. Teacher Attendance Dashboard

Teacher view:

```text
Today's Class

Present     38
Late         4
Absent       3
Pending      1
```

Student table:

```text
Student       Status      Check-in      Method
Asha          Present     08:58         Biometric
Rahul         Late        09:08         OTP
Meera         Present     08:59         QR
Arjun         Absent      —             —
```

Teacher actions:

* mark attendance
* approve correction
* request verification
* add absence reason
* approve leave
* flag suspicious attendance
* view history

---

# 109. Admin Attendance Dashboard

Provide:

### Institution

* attendance rate
* daily attendance
* weekly attendance
* monthly attendance
* hourly attendance
* late rate
* absenteeism
* attendance trends

### Course

* attendance by course
* attendance by teacher
* attendance by batch

### Student

* attendance percentage
* consecutive absences
* repeated lateness
* attendance risk

### Risk

Identify:

```text
High Risk
Medium Risk
Normal
Improving
```

Use explainable rules initially.

Example:

> "Attendance risk increased because the learner missed 3 of the last 5 sessions."

Do not infer personal circumstances without evidence.

---

# 110. Attendance + AI Intervention

Attendance should feed the existing learner intelligence system.

Example:

```text
Attendance drops
       ↓
Engagement drops
       ↓
Assessment performance drops
       ↓
AI identifies risk
       ↓
Recommend mentor check-in
```

AI should NOT automatically label a learner as lazy or unmotivated.

Use neutral descriptions:

> "Participation has decreased over the past two weeks."

---

# 111. Attendance Recovery

Implement recovery mechanisms.

Examples:

### Make-up Session

Learner can attend an approved replacement session.

### Recovery Quiz

Missed class → take targeted assessment.

### Recorded Lesson

View approved recording.

### Mentor Approval

Teacher/mentor validates alternative learning.

### Learning Recovery Path

System generates:

```text
Missed topic
   ↓
15-minute summary
   ↓
5-question assessment
   ↓
Practical activity
   ↓
Mastery check
```

This connects attendance back to actual learning.

---

# 112. Leave Management

Support:

* leave request
* leave type
* reason
* date range
* supporting documentation where institutionally required
* teacher approval
* mentor approval
* admin approval
* status
* audit history

Statuses:

```text
PENDING
APPROVED
REJECTED
CANCELLED
```

Approved leave must not incorrectly count as unexplained absence.

---

# 113. Daily Planner

Create a unified **My Day** experience.

Example:

```text
GOOD MORNING, PRIYA 👋

Today

08:45
Check in

09:00–10:00
Backend Development

10:00–10:15
Break

10:15
Review SQL joins — 10 min

17:30
Daily learning mission — 20 min

20:00
Quiz review — 5 min
```

The daily planner combines:

* classes
* attendance
* learning path
* homework
* exams
* revision
* projects
* mentor meetings
* personal goals

---

# 114. Intelligent Daily Scheduling

Use the learner's:

* class schedule
* availability
* goal
* deadlines
* estimated learning time
* mastery
* upcoming exams
* preferred learning times

to generate a daily schedule.

Example:

```text
Available:
45 minutes

System recommends:

10 min
Spaced review

20 min
Main lesson

10 min
Coding challenge

5 min
Reflection
```

The scheduler must adjust when the learner misses an activity.

Do not punish the learner by endlessly moving unfinished work into tomorrow.

Re-plan intelligently.

---

# 115. Daily Check-In

Create a lightweight emotional/energy check-in.

Examples:

> How are you feeling today?

```text
🔥 Ready
🙂 Good
😐 Okay
😴 Tired
😵 Overwhelmed
```

Optional:

> How much time do you have?

```text
5 min
15 min
30 min
60+ min
```

The learning engine adapts the daily plan.

Do not use this as a medical or psychological diagnosis.

---

# 116. Mobile Application

Build a companion mobile app.

Preferred approach:

* React Native
* Expo where practical

Share TypeScript domain contracts with the web application.

The mobile app should prioritize:

* attendance
* daily schedule
* notifications
* learning sessions
* video
* quizzes
* flashcards
* AI tutor
* progress
* rewards
* streaks
* profile

---

# 117. Mobile Attendance Experience

Make attendance extremely simple.

Student opens app:

```text
Today's Class

Backend Development
09:00–10:00

Attendance
[Check In]
```

Possible verification:

```text
Use Face ID
     OR
Use Fingerprint
     OR
Enter OTP
     OR
Scan QR
```

After successful verification:

```text
✓ You're checked in

Backend Development
09:03 AM

Attendance: Present
+20 XP
```

The reward should appear immediately but should not encourage fraudulent check-ins.

---

# 118. Mobile Push Notifications

Support configurable push notifications.

Examples:

> Your class starts in 15 minutes.

> Attendance is now open.

> You are marked present.

> You have a 10-minute learning mission.

> Your SQL review is due.

> New mentor feedback is available.

> You are one quest away from your next badge.

Learners must control notification preferences.

---

# 119. Attendance Notifications

Send configurable notifications for:

* class starting
* attendance opening
* attendance nearing close
* late status
* absence
* approved leave
* attendance percentage falling below threshold

Example:

> Attendance for Database Systems closes in 5 minutes.

---

# 120. Parent / Guardian Mode

Where appropriate for schools or minors, create an optional guardian role.

Guardian can see:

* attendance
* missed sessions
* schedule
* approved achievements
* academic progress
* notifications

Do not expose private AI conversations or unrelated learner data by default.

Access must follow institutional policy and applicable privacy requirements.

---

# 121. Reward Engine

Create a dedicated reward engine.

Rewards should be triggered by meaningful learning behavior.

Examples:

### Attendance

* first check-in
* 5-day attendance streak
* 10 sessions attended
* perfect weekly attendance

### Learning

* first lesson
* first quiz
* mastery improvement
* project completed
* review streak

### Progress

* milestone completed
* course completed
* career milestone completed

### Personal Growth

* improved from repeated failure
* recovered missed content
* completed difficult challenge

Avoid rewarding only speed.

Reward consistency, mastery and persistence.

---

# 122. Reward Types

Support:

```text
XP
coins
points
badges
levels
streaks
certificates
titles
avatars/cosmetics
achievement cards
leaderboard position
unlockable content
mentor recognition
institutional rewards
```

Use configurable policies.

Do not hard-code monetary rewards into the core system.

---

# 123. Reward Rules Engine

Example:

```text
EVENT:
LEARNING_ACTIVITY_COMPLETED

IF:
activity_is_meaningful = true
AND
not_duplicate = true

THEN:
XP + 20
```

Another:

```text
EVENT:
ATTENDANCE_VERIFIED

IF:
status = PRESENT

THEN:
XP + 15
```

Use a ledger.

Never simply update:

```text
xp = xp + 20
```

without recording why.

Instead:

```text
XP Ledger

+20
Reason:
Completed REST API challenge

+15
Reason:
Verified attendance
```

This makes rewards auditable.

---

# 124. Anti-Gaming System

Critical.

Learners should not be able to farm rewards by:

* repeatedly opening lessons
* repeatedly checking in
* repeatedly answering trivial questions
* abusing replay
* sharing OTPs
* using duplicate devices
* exploiting retries

Implement:

* idempotency
* event uniqueness
* rate limits
* reward caps
* anomaly detection
* session verification
* suspicious activity flags

---

# 125. Attendance Fraud Detection

Build rule-based detection first.

Potential suspicious patterns:

```text
same device used by many unrelated learners
impossible location changes
repeated OTP sharing patterns
rapid check-in/out anomalies
multiple accounts from one device
attendance outside expected time
```

Do not automatically accuse users.

Instead create:

```text
Attendance Verification Risk

Low
Medium
High
```

and route high-risk cases for authorized review.

---

# 126. Leaderboards

Provide optional leaderboards:

### Individual

* XP
* learning streak
* challenges

### Cohort

* weekly progress
* attendance
* learning milestones

### Team

* collaborative quests

Do not make attendance leaderboards public by default.

Allow institutions to configure visibility.

Avoid ranking learners in a way that humiliates low-performing students.

---

# 127. Team Challenges

Create collaborative learning challenges.

Example:

> Backend Batch Challenge

Goal:

```text
Complete 500 learning minutes this week.
```

Progress:

```text
██████████████░░ 82%
```

Team members earn recognition for meaningful contributions.

---

# 128. Reward Shop

Optional future module:

Learners can spend earned points/coins on:

* avatar customization
* profile themes
* cosmetic items
* special titles
* extra challenge access
* non-academic digital rewards

Keep the reward shop separate from academic grading.

Do not allow learners to purchase grades or bypass assessments.

---

# 129. Attendance + Reward + Learning Graph

Create a unified event architecture:

```text
Attendance Event
        ↓
Learning Participation
        ↓
Progress Event
        ↓
Mastery Update
        ↓
Reward Event
        ↓
Notification
        ↓
Next Recommendation
```

Example:

```text
Student attends class
        ↓
Verified biometric check-in
        ↓
+15 XP
        ↓
Class activity assigned
        ↓
Learner completes quiz
        ↓
+30 XP
        ↓
Skill mastery increases
        ↓
Next-best learning activity updated
```

---

# 130. Unified Gamified Progress

The dashboard should show multiple progress dimensions.

Example:

```text
🎯 Career Goal
Backend Engineer
68%

📚 Learning
47 / 70 lessons

🧠 Mastery
31 / 50 skills

🏫 Attendance
94%

🔥 Streak
8 days

⭐ XP
4,850

🏆 Badges
12
```

Never allow XP to visually imply academic mastery.

Keep:

```text
ENGAGEMENT
```

and:

```text
MASTERY
```

visually distinct.

---

# 131. Daily Reward Summary

At the end of a day:

```text
TODAY COMPLETE 🎉

Attendance        +15 XP
REST API lesson   +25 XP
Quiz              +30 XP
Daily streak      +10 XP

Total             +80 XP

You improved:
REST API Design ↑ 7%

Tomorrow:
Authentication — 20 minutes
```

This should reinforce actual progress.

---

# 132. Teacher Reward Controls

Teachers should be able to award:

* recognition
* bonus points
* badges
* encouragement
* challenge completion

But teacher-awarded rewards must be auditable.

Example:

```text
+50 XP
Awarded by:
Teacher: Neha Sharma

Reason:
Excellent project debugging
```

---

# 133. Admin Reward Configuration

Admin can configure:

* XP values
* reward rules
* streak rules
* badge definitions
* leaderboard policy
* attendance rewards
* challenge rewards
* anti-gaming thresholds

Super Admin can configure global defaults.

---

# 134. Unified Mobile Navigation

Student mobile navigation:

```text
Home
Learn
Schedule
Attendance
Rewards
AI Tutor
Profile
```

The main screen should emphasize:

```text
What should I do now?
```

not an overwhelming collection of metrics.

---

# 135. Mobile Offline Support

Where practical, support limited offline capability:

* downloaded lessons
* downloaded videos
* flashcards
* local progress queue

When reconnected:

```text
local events
    ↓
sync
    ↓
server validation
    ↓
mastery/reward update
```

Server remains authoritative for:

* attendance
* grades
* rewards
* final progress

Do not trust client-side reward calculations.

---

# 136. Device Management

Support:

* registered devices
* device nickname
* last active
* platform
* revocation
* suspicious device alert

For biometric/passkey authentication, use secure platform credentials.

Do not store biometric templates in application tables.

---

# 137. Attendance API

Add endpoints such as:

```text
/api/v1/attendance/policies
/api/v1/attendance/sessions
/api/v1/attendance/check-in
/api/v1/attendance/check-out
/api/v1/attendance/otp
/api/v1/attendance/qr
/api/v1/attendance/verification
/api/v1/attendance/history
/api/v1/attendance/summary
/api/v1/attendance/exceptions
/api/v1/attendance/leave
/api/v1/attendance/reports
/api/v1/attendance/risk
```

---

# 138. Rewards API

Add:

```text
/api/v1/rewards
/api/v1/rewards/balance
/api/v1/rewards/ledger
/api/v1/rewards/achievements
/api/v1/rewards/badges
/api/v1/rewards/quests
/api/v1/rewards/streaks
/api/v1/rewards/leaderboards
/api/v1/rewards/events
```

---

# 139. Mobile Authentication

Support:

* email/password where required
* OTP
* passkeys
* biometric unlock
* secure session refresh
* device registration
* logout all devices

Do not treat a biometric scan as a standalone server-side password.

Use platform authentication primitives and cryptographic assertions.

---

# 140. Daily Management Admin Module

Create a dedicated:

> **Daily Operations**

dashboard.

Show:

```text
Today's Sessions
Live Classes
Attendance Open
Attendance Closed
Missing Attendance
Pending Leave
At-Risk Learners
Upcoming Exams
Mentor Interventions
```

This becomes the operational command center.

---

# 141. Live Session Mode

Teachers can start a session:

```text
DATABASE SYSTEMS
10:00–11:00

Attendance:
38 / 45

Present
Late
Absent

[Open OTP]
[Show QR]
[Biometric Verification]

Live engagement:
31 active

Quiz:
72% average
```

Teacher can immediately see whether learners are struggling.

---

# 142. Real-Time Learning + Attendance

Where WebSockets/realtime infrastructure is justified, support:

* attendance state updates
* live quiz responses
* teacher announcements
* session timers
* learner progress
* live challenge state

Do not introduce realtime infrastructure for data that does not need realtime behavior.

---

# 143. Attendance Analytics + Learning Analytics

Add correlation views.

Example:

```text
Attendance Rate      Mastery

95–100%              84%
85–94%               77%
70–84%               69%
<70%                 54%
```

Do not interpret correlation as causation.

Use analytics to identify areas for investigation.

---

# 144. Attendance Risk + Intervention

Example:

```text
Learner Risk

Attendance: Declining
Learning Activity: Declining
Assessment: Stable

Recommended action:
Mentor check-in
```

Another:

```text
Attendance: High
Mastery: Low

Recommended action:
Teacher intervention
```

The system should distinguish attendance problems from learning problems.

---

# 145. Final Integrated Student Journey

The ideal student experience is:

```text
Sign Up
   ↓
Goal Conversation
   ↓
Learner Profile
   ↓
Diagnostic
   ↓
Personalized Path
   ↓
Daily Schedule
   ↓
Class Attendance
   ↓
Learning Activity
   ↓
Assessment
   ↓
Mastery Update
   ↓
Reward
   ↓
AI Explanation
   ↓
Next Best Action
   ↓
Review / Project
   ↓
Milestone
   ↓
Career Progress
```

---

# 146. Final Integrated Product

The final platform should therefore be understood as six connected systems:

```text
┌─────────────────────────────────────────────┐
│          PERSONALIZED LEARNING              │
│                                             │
│ Goal → Skill Gap → Path → Mastery           │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│             DAILY MANAGEMENT                │
│                                             │
│ Schedule → Classes → Attendance → Tasks      │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│              AI ASSISTANT                   │
│                                             │
│ Tutor → Explain → Recommend → Coach          │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│             GAMIFICATION                    │
│                                             │
│ XP → Streak → Quest → Badge → Rewards       │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│              ANALYTICS                      │
│                                             │
│ Attendance → Engagement → Mastery → Risk     │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│             MOBILE APP                      │
│                                             │
│ Learn → Attend → Practice → Reward → Coach  │
└─────────────────────────────────────────────┘
```

The product should feel like a **personal AI learning coach + LMS + academic management system + attendance platform + Duolingo-style motivation system + mobile companion**, rather than six disconnected products.

The most important integration is:

> **Attendance → Participation → Learning Evidence → Mastery → Reward → Recommendation → Next Daily Action**

That loop should be implemented as a first-class product capability.
