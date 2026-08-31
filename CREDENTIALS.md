# Learn-it HCL — Default Credentials & Seed Accounts

Below are the default developer / test accounts created by the database seed scripts. All accounts are configured with the HCL Demo organization.

| Role | Email | Password | Scope | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@learnit.com` | `Admin@1234` | Global / System Admin | Platform administrator (seeded via Prisma). |
| **Org Admin 1** | `admin@learnit.dev` | `Password1!` | HCL Org Admin | Primary HCL organization administrator. |
| **Org Admin 2** | `admin2@learnit.dev` | `Password1!` | HCL Org Admin | Secondary HCL organization administrator. |
| **Teacher 1** | `teacher@learnit.dev` | `Password1!` | Teacher / Instructor | Primary instructor (Smith). |
| **Teacher 2** | `teacher2@learnit.dev` | `Password1!` | Teacher / Instructor | Secondary instructor (Doe). |
| **Student 1** | `student@learnit.dev` | `Password1!` | Student (Alice Johnson) | Goal: Become a Full-Stack Python Engineer (35% progress) |
| **Student 2** | `student2@learnit.dev` | `Password1!` | Student (Bob Miller) | Goal: Master Frontend with React & TS (45% progress) |
| **Student 3** | `student3@learnit.dev` | `Password1!` | Student (Charlie Davis) | Goal: Cloud & DevOps Architect (20% progress) |
| **Student 4** | `student4@learnit.dev` | `Password1!` | Student (Diana Prince) | Goal: Data Scientist & ML Engineer (15% progress) |
| **Student 5** | `student5@learnit.dev` | `Password1!` | Student (Ethan Hunt) | Goal: FastAPI Microservices Developer (60% progress) |
| **Student 6** | `student6@learnit.dev` | `Password1!` | Student (Fiona Gallagher) | Goal: Database Administrator (50% progress) |
| **Student 7** | `student7@learnit.dev` | `Password1!` | Student (George Clark) | Goal: Software Test Automation Lead (75% progress) |
| **Student 8** | `student8@learnit.dev` | `Password1!` | Student (Hannah Abbott) | Goal: Next.js Product Engineer (30% progress) |

---

### How to Seed the Database Again
If you ever recreate the Docker volumes or reset the PostgreSQL DB, you can re-populate these records by running:

1. **Frontend Prisma Seed**:
   ```bash
   cd apps/web
   npx prisma db seed
   ```

2. **Backend Engine Seed**:
   ```bash
   cd backend
   venv\Scripts\python -m scripts.seed
   ```
