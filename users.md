# 👤 System & Demo User Accounts — Learn-it HCL

This document contains all default user accounts, credentials, roles, and permissions configured across the **Learn-it HCL** platform (Next.js Web Frontend & FastAPI ML Microservice).

---

## 🔑 User Accounts Directory

| Full Name | Role | Email / Username | Default Password | Organization / Tenant | Key Capabilities |
|---|---|---|---|---|---|
| **System Super Admin** | `super_admin` | `superadmin@learnit.com` | `Admin123!` | Learn-it HCL System (`learnit-system`) | Full platform administration, multi-tenant management, system settings |
| **Admin User** | `admin` | `admin@learnit.dev` | `Password1!` | Learn-it HCL Demo (`learnit-demo`) | Organization management, content curation, user administration |
| **Teacher Smith** | `teacher` | `teacher@learnit.dev` | `Password1!` | Learn-it HCL Demo (`learnit-demo`) | AI Course Generation, curriculum design, student tracking, quiz authoring |
| **Student Demo** | `student` | `student@learnit.dev` | `Password1!` | Learn-it HCL Demo (`learnit-demo`) | Course enrollment, adaptive learning roadmap, quizzes, XP & badges |

---

## 🛡️ Role & Permission Matrix

### 1. **Super Admin (`super_admin`)**
* **Access Level**: System Level (Global)
* **Email**: `superadmin@learnit.com`
* **Default Password**: `Admin123!`
* **Seeded In**: `apps/web/prisma/seed.ts`
* **Responsibilities**:
  * Manage global system settings and custom RBAC roles.
  * Access cross-tenant analytics and telemetry.
  * System-wide user provision & tenant organization setup.

### 2. **Organization Admin (`admin`)**
* **Access Level**: Organization Level
* **Email**: `admin@learnit.dev`
* **Default Password**: `Password1!`
* **Seeded In**: `backend/scripts/seed.py`
* **Responsibilities**:
  * Manage organization users (Teachers, Students).
  * Approve and publish generated course materials.
  * Review organization-wide skill gap reports.

### 3. **Teacher / Instructor (`teacher`)**
* **Access Level**: Educator Level
* **Email**: `teacher@learnit.dev`
* **Default Password**: `Password1!`
* **Seeded In**: `backend/scripts/seed.py`
* **Responsibilities**:
  * Use the **AI Course Generator** to build dynamic learning paths.
  * Edit and publish modules, chapters, lessons, and diagnostic tests.
  * Monitor student mastery progress and engagement metrics.

### 4. **Student / Learner (`student`)**
* **Access Level**: Learner Level
* **Email**: `student@learnit.dev`
* **Default Password**: `Password1!`
* **Seeded In**: `backend/scripts/seed.py`
* **Pre-configured Goal**: *"Become a Full-Stack Python Developer"* (Target: Backend Engineer)
* **Responsibilities**:
  * Take AI-guided diagnostic assessments.
  * Interact with the **AI Assistant / Tutor**.
  * Earn XP, maintain daily streaks, complete quests, and unlock badges.

---

## ⚡ How to Seed Database Accounts

### Frontend Database (Prisma / PostgreSQL)
```powershell
cd apps\web
npx prisma db seed
```

### Backend Microservice Database (FastAPI / SQLite / PostgreSQL)
```powershell
cd backend
.\venv\Scripts\activate
python -m scripts.seed
```
