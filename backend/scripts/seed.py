"""
Seed Data Script — Populates the database with demo data.

Safe, idempotent, and populates all tables with at least 10 entries of realistic mock data.
"""

import asyncio
import uuid
import random
from datetime import datetime, timezone, timedelta, date

from sqlalchemy import text
from app.database import engine, async_session_factory
from app.generated_models import Base


async def seed():
    """Seed the database with demo data using check-before-insert for idempotency."""
    print("🌱 Starting database seed...")

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Schema checked/created")

    async with async_session_factory() as db:
        
        # ── 1. Organizations (10 Organizations) ──
        orgs = [
            ("Learn-it HCL Demo", "learnit-demo"),
            ("HCL Technologies Ltd", "hcl-tech"),
            ("Google Cloud Academy", "google-cloud"),
            ("Microsoft Learning Center", "microsoft-org"),
            ("Meta Developer Circle", "meta-academy"),
            ("Amazon Web Services Training", "amazon-web"),
            ("Netflix Engineering Hub", "netflix-eng"),
            ("Apple Developer Academy", "apple-learn"),
            ("Tesla Training Academy", "tesla-academy"),
            ("NVIDIA Deep Learning Institute", "nvidia-gpu"),
        ]
        org_ids = []
        for name, slug in orgs:
            res = await db.execute(text("SELECT id FROM organizations WHERE slug = :slug"), {"slug": slug})
            row = res.fetchone()
            if row:
                oid = row[0]
            else:
                oid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO organizations (id, name, slug, tenant_type, is_active, created_at, updated_at)
                    VALUES (:id, :name, :slug, 'standalone', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {"id": oid, "name": name, "slug": slug})
            org_ids.append(oid)
        print(f"✅ Organizations: {len(org_ids)} created/verified")
        org_id = org_ids[0] # primary default org

        # ── 2. Users (12 Users total: 2 admins, 2 teachers, 8 students) ──
        users_to_seed = [
            {"name": "System Admin", "email": "admin@learnit.dev", "role": "admin"},
            {"name": "HCL Org Admin", "email": "admin2@learnit.dev", "role": "admin"},
            {"name": "Instructor Smith", "email": "teacher@learnit.dev", "role": "teacher"},
            {"name": "Instructor Doe", "email": "teacher2@learnit.dev", "role": "teacher"},
            # 8 Students
            {"name": "Alice Johnson", "email": "student@learnit.dev", "role": "student"},
            {"name": "Bob Miller", "email": "student2@learnit.dev", "role": "student"},
            {"name": "Charlie Davis", "email": "student3@learnit.dev", "role": "student"},
            {"name": "Diana Prince", "email": "student4@learnit.dev", "role": "student"},
            {"name": "Ethan Hunt", "email": "student5@learnit.dev", "role": "student"},
            {"name": "Fiona Gallagher", "email": "student6@learnit.dev", "role": "student"},
            {"name": "George Clark", "email": "student7@learnit.dev", "role": "student"},
            {"name": "Hannah Abbott", "email": "student8@learnit.dev", "role": "student"},
        ]
        pwd = "$2b$10$eNA1n/p8xbhSZ42qllKAKu3bxh3vhRLF3QY4tGKqHePMTCnnpjRiu" # pre-computed bcrypt hash for 'Password1!'
        
        student_ids = []
        teacher_ids = []
        for u in users_to_seed:
            res = await db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": u["email"]})
            row = res.fetchone()
            if row:
                uid = row[0]
            else:
                uid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO users (id, tenant_id, email, hashed_password, full_name, role, is_active, is_verified, created_at, updated_at)
                    VALUES (:id, :tid, :email, :pwd, :name, :role, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": uid, "tid": org_id, "email": u["email"],
                    "pwd": pwd, "name": u["name"], "role": u["role"]
                })
            if u["role"] == "student":
                student_ids.append(uid)
            elif u["role"] == "teacher":
                teacher_ids.append(uid)
        print(f"✅ Users: {len(users_to_seed)} created/verified")

        # ── 3. Learner Profiles, Goals, and Streaks (10 of each) ──
        student_goals = [
            ("Become a Full-Stack Python Engineer", "career", "Backend Engineer", 12, 10, 35.0),
            ("Master Frontend with React & TS", "career", "Frontend Engineer", 8, 8, 45.0),
            ("Cloud & DevOps Architect", "career", "DevOps Engineer", 16, 12, 20.0),
            ("Data Scientist & ML Engineer", "career", "Data Scientist", 20, 15, 15.0),
            ("FastAPI Microservices Developer", "skill", "API Engineer", 6, 6, 60.0),
            ("Database Administrator (DBA)", "career", "Database Administrator", 10, 8, 50.0),
            ("Software Test Automation Lead", "career", "QA Engineer", 8, 10, 75.0),
            ("Next.js Product Engineer", "career", "Full-Stack Developer", 12, 12, 30.0),
            ("Solutions Architect (System Design)", "skill", "Solutions Architect", 14, 8, 25.0),
            ("Git & DevOps Practitioner", "skill", "Release Engineer", 4, 5, 80.0),
        ]

        student_profiles = []
        for i, sid in enumerate(student_ids):
            # Profile
            res = await db.execute(text("SELECT id FROM learner_profiles WHERE user_id = :uid"), {"uid": sid})
            row = res.fetchone()
            if row:
                profile_id = row[0]
            else:
                profile_id = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO learner_profiles (id, user_id, tenant_id, language, timezone, locale, onboarding_completed, created_at, updated_at)
                    VALUES (:id, :uid, :tid, 'en', 'UTC', 'en-US', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {"id": profile_id, "uid": sid, "tid": org_id})
            student_profiles.append(profile_id)
            
            # Goal
            goal_title, goal_type, target_role, horizon, hours, progress = student_goals[i]
            res = await db.execute(text("SELECT id FROM learner_goals WHERE learner_id = :lid AND title = :title"), {"lid": profile_id, "title": goal_title})
            if not res.fetchone():
                await db.execute(text("""
                    INSERT INTO learner_goals (id, learner_id, tenant_id, title, goal_type, target_role, time_horizon_weeks, hours_per_week, is_active, progress_percentage, created_at, updated_at)
                    VALUES (:id, :lid, :tid, :title, :type, :role, :horizon, :hours, true, :progress, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": str(uuid.uuid4()), "lid": profile_id, "tid": org_id,
                    "title": goal_title, "type": goal_type, "role": target_role,
                    "horizon": horizon, "hours": hours, "progress": progress
                })
            
            # Streak
            res = await db.execute(text("SELECT id FROM streaks WHERE learner_id = :lid"), {"lid": profile_id})
            if not res.fetchone():
                current_streak = 2 + (i % 7)
                longest_streak = current_streak + 3
                await db.execute(text("""
                    INSERT INTO streaks (id, learner_id, tenant_id, current_count, longest_count, last_activity_date, freeze_count, is_active, created_at, updated_at)
                    VALUES (:id, :lid, :tid, :cc, :lc, CURRENT_DATE, 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {"id": str(uuid.uuid4()), "lid": profile_id, "tid": org_id, "cc": current_streak, "lc": longest_streak})

        print(f"✅ Student profiles, goals, and streaks: {len(student_ids)} created/verified")

        # ── 4. Skills (12 Skills) ──
        skills = [
            ("Python Basics", "python-basics", "programming", 1),
            ("Data Structures", "data-structures", "programming", 2),
            ("SQL Fundamentals", "sql-fundamentals", "databases", 1),
            ("REST APIs", "rest-apis", "backend", 2),
            ("FastAPI", "fastapi", "backend", 3),
            ("React.js", "reactjs", "frontend", 2),
            ("TypeScript", "typescript", "frontend", 2),
            ("Machine Learning", "machine-learning", "data-science", 3),
            ("Docker", "docker", "devops", 2),
            ("Git & GitHub", "git-github", "tools", 1),
            ("System Design", "system-design", "architecture", 4),
            ("Testing", "testing", "quality", 2),
        ]
        skill_ids = {}
        for name, slug, category, difficulty in skills:
            res = await db.execute(text("SELECT id FROM skills WHERE slug = :slug"), {"slug": slug})
            row = res.fetchone()
            if row:
                sid = row[0]
            else:
                sid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO skills (id, tenant_id, name, slug, category, difficulty_level, is_active, created_at, updated_at)
                    VALUES (:id, :tid, :name, :slug, :cat, :diff, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": sid, "tid": org_id, "name": name,
                    "slug": slug, "cat": category, "diff": difficulty,
                })
            skill_ids[slug] = sid
        print(f"✅ Skills: {len(skills)} created/verified")

        # ── 5. Skill Relationships (Prerequisites) ──
        prereqs = [
            ("data-structures", "python-basics"),
            ("rest-apis", "python-basics"),
            ("fastapi", "rest-apis"),
            ("fastapi", "python-basics"),
            ("machine-learning", "python-basics"),
            ("machine-learning", "data-structures"),
            ("system-design", "rest-apis"),
            ("system-design", "data-structures"),
            ("reactjs", "typescript"),
        ]
        for target, source in prereqs:
            if target in skill_ids and source in skill_ids:
                res = await db.execute(text("SELECT id FROM skill_relationships WHERE source_skill_id = :src AND target_skill_id = :tgt"), {"src": skill_ids[source], "tgt": skill_ids[target]})
                if not res.fetchone():
                    await db.execute(text("""
                        INSERT INTO skill_relationships (id, tenant_id, source_skill_id, target_skill_id, relationship_type, strength)
                        VALUES (:id, :tid, :src, :tgt, 'prerequisite', 1.0)
                    """), {
                        "id": str(uuid.uuid4()), "tid": org_id,
                        "src": skill_ids[source], "tgt": skill_ids[target],
                    })
        print(f"✅ Skill prerequisites: {len(prereqs)} created/verified")

        # ── 6. Mastery States (Seeded for all students) ──
        base_mastery = [
            ("python-basics", 0.82, 0.9, "mastered", 8),
            ("data-structures", 0.55, 0.7, "learning", 5),
            ("sql-fundamentals", 0.45, 0.6, "learning", 3),
            ("rest-apis", 0.30, 0.5, "learning", 2),
            ("git-github", 0.75, 0.85, "practiced", 6),
            ("testing", 0.20, 0.4, "learning", 1),
            ("docker", 0.10, 0.3, "not_started", 0),
            ("typescript", 0.35, 0.55, "learning", 2),
        ]
        
        for idx, profile_id in enumerate(student_profiles):
            for slug, score, confidence, status, evidence in base_mastery:
                if slug in skill_ids:
                    res = await db.execute(text("SELECT id FROM mastery_states WHERE learner_id = :lid AND skill_id = :sid"), {"lid": profile_id, "sid": skill_ids[slug]})
                    if not res.fetchone():
                        adjusted_score = min(1.0, max(0.0, score + (idx * 0.02 - 0.08)))
                        adjusted_status = status
                        if adjusted_score > 0.8:
                            adjusted_status = "mastered"
                        elif adjusted_score > 0.6:
                            adjusted_status = "practiced"
                        elif adjusted_score > 0.2:
                            adjusted_status = "learning"
                        else:
                            adjusted_status = "not_started"
                            
                        await db.execute(text("""
                            INSERT INTO mastery_states (id, learner_id, skill_id, tenant_id, mastery_score, confidence, evidence_count, status, retention_estimate, difficulty_estimate, last_assessed_at, created_at, updated_at)
                            VALUES (:id, :lid, :sid, :tid, :score, :conf, :ev, :status, 0.9, 0.5, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """), {
                            "id": str(uuid.uuid4()), "lid": profile_id,
                            "sid": skill_ids[slug], "tid": org_id,
                            "score": adjusted_score, "conf": confidence,
                            "ev": evidence, "status": adjusted_status,
                        })
        print(f"✅ Mastery states seeded for {len(student_profiles)} students")

        # ── 7. Career Roles & Role Skills (10 Career Roles) ──
        career_roles = [
            ("Backend Engineer", "backend-engineer", "Build robust backends and APIs.", "engineering"),
            ("Frontend Engineer", "frontend-engineer", "Build beautiful, responsive user interfaces.", "engineering"),
            ("Full-Stack Developer", "full-stack-developer", "Develop end-to-end web applications.", "engineering"),
            ("DevOps Engineer", "devops-engineer", "Manage CI/CD, cloud infra, and containers.", "devops"),
            ("Data Scientist", "data-scientist", "Analyze data and build machine learning models.", "data-science"),
            ("Machine Learning Engineer", "ml-engineer", "Deploy production ML models at scale.", "data-science"),
            ("Database Administrator (DBA)", "database-administrator", "Optimize database systems and schemas.", "databases"),
            ("QA Automation Engineer", "qa-engineer", "Build robust automated testing frameworks.", "quality"),
            ("Solutions Architect", "solutions-architect", "Design scalable cloud infrastructures.", "architecture"),
            ("Release Engineer", "release-engineer", "Manage code packaging, versioning, and shipping.", "tools"),
        ]
        
        role_skills_mapping = {
            "backend-engineer": [("python-basics", 0.8), ("fastapi", 0.9), ("sql-fundamentals", 0.8)],
            "frontend-engineer": [("reactjs", 0.9), ("typescript", 0.8), ("git-github", 0.7)],
            "full-stack-developer": [("python-basics", 0.7), ("reactjs", 0.8), ("sql-fundamentals", 0.7), ("fastapi", 0.7)],
            "devops-engineer": [("docker", 0.9), ("git-github", 0.8), ("system-design", 0.7)],
            "data-scientist": [("python-basics", 0.9), ("machine-learning", 0.9), ("sql-fundamentals", 0.7)],
            "ml-engineer": [("python-basics", 0.8), ("machine-learning", 0.9), ("docker", 0.7)],
            "database-administrator": [("sql-fundamentals", 0.95), ("system-design", 0.8)],
            "qa-engineer": [("testing", 0.95), ("git-github", 0.7), ("python-basics", 0.6)],
            "solutions-architect": [("system-design", 0.95), ("docker", 0.8), ("rest-apis", 0.8)],
            "release-engineer": [("git-github", 0.9), ("docker", 0.8), ("testing", 0.7)]
        }

        for name, slug, desc, cat in career_roles:
            res = await db.execute(text("SELECT id FROM career_roles WHERE slug = :slug"), {"slug": slug})
            row = res.fetchone()
            if row:
                crole_id = row[0]
            else:
                crole_id = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO career_roles (id, tenant_id, name, slug, description, category, is_active, created_at, updated_at)
                    VALUES (:id, :tid, :name, :slug, :desc, :cat, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": crole_id, "tid": org_id, "name": name, "slug": slug, "desc": desc, "cat": cat
                })
            
            # Map role skills
            for skill_slug, min_mastery in role_skills_mapping.get(slug, []):
                if skill_slug in skill_ids:
                    res = await db.execute(text("SELECT id FROM role_skills WHERE career_role_id = :crid AND skill_id = :sid"), {"crid": crole_id, "sid": skill_ids[skill_slug]})
                    if not res.fetchone():
                        await db.execute(text("""
                            INSERT INTO role_skills (id, tenant_id, career_role_id, skill_id, importance, minimum_mastery)
                            VALUES (:id, :tid, :crid, :sid, 'essential', :mastery)
                        """), {
                            "id": str(uuid.uuid4()), "tid": org_id,
                            "crid": crole_id, "sid": skill_ids[skill_slug], "mastery": min_mastery
                        })
        print(f"✅ Career roles and role skills: {len(career_roles)} created/verified")

        # ── 8. Courses, Modules, Chapters, Lessons, Assessments, Questions (10 Courses) ──
        courses_data = [
            ("Full-Stack Python Developer", "full-stack-python", "Master Python, FastAPI, SQL, and React to build production web applications.", "From Python basics to full-stack mastery", "beginner", 20),
            ("Modern Frontend with React", "modern-react", "Learn to build modern, performant user interfaces with React, state management, and Tailwind.", "Modern UI Development with React", "intermediate", 15),
            ("FastAPI Web Development", "fastapi-web", "Build high-performance, asynchronous REST APIs with FastAPI and Python.", "High-Performance APIs with FastAPI", "intermediate", 12),
            ("Docker for Developers", "docker-dev", "Containerize your applications and master devops workflows using Docker.", "Learn Containerization with Docker", "beginner", 8),
            ("SQL & Databases Masterclass", "sql-mastery", "Master relational database design, writing complex SQL queries, and optimization.", "Relational Database Design and SQL Mastery", "beginner", 10),
            ("Machine Learning Foundations", "ml-foundations", "Understand math, algorithms, and practical applications of Machine Learning.", "Introduction to Machine Learning", "advanced", 30),
            ("TypeScript Essentials", "typescript-essentials", "Add static types to your JavaScript projects for cleaner, safer web applications.", "Master static typing in JS with TS", "beginner", 6),
            ("Advanced System Design", "advanced-system-design", "Learn to design scalable, fault-tolerant, and high-availability software architectures.", "Design web-scale architectures", "advanced", 25),
            ("Software Testing & QA", "software-testing", "Master unit testing, integration testing, end-to-end testing, and CI/CD automation.", "Code quality, testing, and continuous deployment", "intermediate", 8),
            ("Next.js App Router Masterclass", "nextjs-masterclass", "Build production-ready Next.js web applications using the new App Router.", "Learn next-gen React applications with Next.js", "advanced", 18),
        ]
        
        for title, slug, desc, short, diff, hours in courses_data:
            res = await db.execute(text("SELECT id FROM courses WHERE slug = :slug"), {"slug": slug})
            row = res.fetchone()
            if row:
                cid = row[0]
            else:
                cid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO courses (id, tenant_id, title, slug, description, short_description,
                        difficulty_level, estimated_duration_hours, language, is_published, is_free,
                        enrollment_count, rating, version, created_at, updated_at)
                    VALUES (:id, :tid, :title, :slug, :desc, :short, :diff, :hours, 'en', true, true, 42, 4.7, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": cid, "tid": org_id, "title": title, "slug": slug, "desc": desc, "short": short, "diff": diff, "hours": hours
                })
            
        course_curriculums = {
            "full-stack-python": {
                "module_title": "Module 1: Python Core Foundations",
                "chapter_title": "Chapter 1: Getting Started with Python",
                "lessons": [
                    ("Introduction to Python Programming", "video", 15, "https://www.youtube.com/embed/jNQXAC9IVRw", "### Introduction to Python\n\nPython is a versatile, readable, high-level programming language. This lesson covers basic setups, runtime engines, and running your first Python script.\n\n* **Easy to Read**: Highly structured syntax.\n* **Interpreted**: No explicit compilation step required.\n* **Dynamic Typing**: Types are checked at runtime."),
                    ("Python Variables & Basic Data Types", "article", 10, None, "### Variables and Data Types\n\nVariables store data. Python has multiple built-in datatypes:\n\n* **integers**: `1, 2, -10`\n* **floats**: `3.14, 0.05`\n* **strings**: `\"Hello, World!\"`\n* **booleans**: `True, False`"),
                    ("Coding Lab: Arithmetic Calculations", "coding", 20, None, "### Lab Exercise\n\nIn this interactive practice session, we will write python scripts to perform calculations. Write a script to calculate area:\n\n```python\nwidth = 5.5\nheight = 10.0\narea = width * height\nprint(f\"Area: {area}\")\n```"),
                ]
            },
            "modern-react": {
                "module_title": "Module 1: React Basics & JSX",
                "chapter_title": "Chapter 1: Components and Props",
                "lessons": [
                    ("What is React & JSX?", "video", 15, "https://www.youtube.com/embed/Ke90Tje7VS0", "### Introduction to React\n\nReact is a declarative component-based UI library. JSX allows writing HTML-like code inside Javascript.\n\n* **JSX**: JavaScript XML.\n* **Components**: Reusable UI blocks.\n* **Virtual DOM**: High performance rendering updates."),
                    ("Understanding Props & Component Trees", "article", 12, None, "### Component Props\n\nProps (properties) allow components to receive input parameters. They are read-only and passed down the component tree:\n\n```jsx\nfunction Welcome(props) {\n  return <h1>Hello, {props.name}</h1>;\n}\n```"),
                    ("React Hook: Practice with useState", "coding", 25, None, "### Interactive Lab\n\nBuild a counter component utilizing state:\n\n```jsx\nimport React, { useState } from 'react';\n\nexport function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Count: {count}\n    </button>\n  );\n}\n```"),
                ]
            },
            "fastapi-web": {
                "module_title": "Module 1: Asynchronous REST APIs",
                "chapter_title": "Chapter 1: Routing & Path Operations",
                "lessons": [
                    ("Intro to FastAPI and Routing", "video", 12, "https://www.youtube.com/embed/tLKKmouU7b0", "### Introduction to FastAPI\n\nFastAPI is a modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints.\n\n* **Fast**: Performance on par with NodeJS & Go.\n* **Fewer Bugs**: Reduce developer errors by 40%.\n* **Intuitive**: Great editor support."),
                    ("FastAPI Pydantic Model Validation", "article", 15, None, "### Pydantic Models\n\nPydantic enforces type validation at run-time, and provides user-friendly errors when data is invalid.\n\n```python\nfrom pydantic import BaseModel\n\nclass UserItem(BaseModel):\n    name: str\n    price: float\n    is_offer: bool | None = None\n```"),
                    ("Coding Lab: Creating path parameter endpoints", "coding", 18, None, "### Practice Lab\n\nWrite a FastAPI path operation to retrieve custom item profiles:\n\n```python\nfrom fastapi import FastAPI\napp = FastAPI()\n\n@app.get(\"/items/{item_id}\")\ndef read_item(item_id: int):\n    return {\"item_id\": item_id, \"status\": \"active\"}\n```"),
                ]
            },
            "docker-dev": {
                "module_title": "Module 1: Docker Containerization",
                "chapter_title": "Chapter 1: Running & Building Containers",
                "lessons": [
                    ("Understanding Docker Concepts", "video", 10, "https://www.youtube.com/embed/3c-iKanjeec", "### What is Docker?\n\nDocker is an open-source platform that automates the deployment of applications inside lightweight, portable containers.\n\n* **Containers**: Shared kernel virtualization.\n* **Images**: Read-only blueprints for containers.\n* **Docker Hub**: Container image registry."),
                    ("Writing Your First Dockerfile", "article", 12, None, "### The Dockerfile\n\nA Dockerfile is a text document that contains all the commands a user could call on the command line to assemble an image.\n\n```dockerfile\nFROM node:18\nWORKDIR /app\nCOPY package.json .\nRUN npm install\nCOPY . .\nCMD [\"npm\", \"start\"]\n```"),
                    ("Lab: Building and Running containers locally", "coding", 20, None, "### Lab Exercise\n\nBuild and run the container locally from the CLI:\n\n```bash\n# Build the docker image\ndocker build -t my-web-app .\n\n# Run the container\ndocker run -p 8080:3000 my-web-app\n```"),
                ]
            },
            "sql-mastery": {
                "module_title": "Module 1: Relational Database & SQL",
                "chapter_title": "Chapter 1: SQL Queries & DDL basics",
                "lessons": [
                    ("Introduction to Relational Databases", "video", 10, "https://www.youtube.com/embed/HXV3zeQKqGY", "### Relational Databases\n\nRelational databases store data in rows and columns. SQL (Structured Query Language) is the standard query language.\n\n* **Tables**: Entity schema layouts.\n* **Primary Key**: Unique row identifier.\n* **Foreign Key**: Relational link between tables."),
                    ("SELECT Queries, Filters and JOINs", "article", 12, None, "### Joining Tables\n\nUse Joins to combine rows from two or more tables based on a related column:\n\n```sql\nSELECT users.full_name, posts.title\nFROM users\nJOIN posts ON users.id = posts.user_id\nWHERE users.is_active = true;\n```"),
                    ("Practice Lab: Writing JOIN Queries", "coding", 20, None, "### Practice Lab\n\nWrite a database join to fetch all courses along with their containing module titles:\n\n```sql\nSELECT c.title AS course, m.title AS module\nFROM courses c\nINNER JOIN modules m ON c.id = m.course_id;\n```"),
                ]
            },
            "ml-foundations": {
                "module_title": "Module 1: Supervised Learning Math",
                "chapter_title": "Chapter 1: Linear Regression & Fitting Models",
                "lessons": [
                    ("Intro to Machine Learning & Algorithms", "video", 20, "https://www.youtube.com/embed/GwIo3gDZUtQ", "### Introduction to ML\n\nMachine learning is a field of inquiry devoted to understanding and building methods that 'learn' from data to make predictions.\n\n* **Supervised Learning**: Training on labelled datasets.\n* **Unsupervised Learning**: Uncovering hidden patterns.\n* **Reinforcement Learning**: Agent learning via reward systems."),
                    ("Linear Regression Formula & Optimization", "article", 15, None, "### Cost Functions & Gradients\n\nLinear Regression aims to find a linear boundary $Y = W^T X + b$ that minimizes the mean-squared-error (MSE) loss function.\n\n* **MSE Loss**: \\frac{1}{2n} \\sum (y - \\hat{y})^2\n* **Gradient Descent**: Update parameters W \\leftarrow W - \\alpha \\nabla_W L"),
                    ("Lab: Building a Regressor with Scikit-Learn", "coding", 25, None, "### Lab Exercise\n\nFit a simple Linear Regression model using scikit-learn:\n\n```python\nimport numpy as np\nfrom sklearn.linear_model import LinearRegression\n\nX = np.array([[1, 1], [1, 2], [2, 2], [2, 3]])\ny = np.dot(X, np.array([1, 2])) + 3\n\nreg = LinearRegression().fit(X, y)\nprint(\"Model Score:\", reg.score(X, y))\n```"),
                ]
            },
            "typescript-essentials": {
                "module_title": "Module 1: Static Typing & Safe Syntax",
                "chapter_title": "Chapter 1: Types, Interfaces & Unions",
                "lessons": [
                    ("Why Static Typing? JavaScript vs TypeScript", "video", 10, "https://www.youtube.com/embed/zQnOBzgSZ90", "### Introduction to TypeScript\n\nTypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.\n\n* **Static Types**: Catch errors during development.\n* **Type Inference**: TS automatically infers types when initialized.\n* **Compilation**: Transpiles down to pure JavaScript."),
                    ("Declaring Interfaces and Union Types", "article", 12, None, "### Interface Declarations\n\nInterfaces allow declaring structured shapes of JS objects:\n\n```typescript\ninterface UserProfile {\n  id: string;\n  name: string;\n  email: string;\n  role: 'admin' | 'student' | 'teacher';\n}\n```"),
                    ("Coding: Typing functions and return types", "coding", 15, None, "### Interactive Lab\n\nDeclare function typing with generic support:\n\n```typescript\nfunction getFirstElement<T>(arr: T[]): T {\n  return arr[0];\n}\nconst element = getFirstElement([\"Alice\", \"Bob\"]);\n```"),
                ]
            },
            "advanced-system-design": {
                "module_title": "Module 1: Designing Large Scale Systems",
                "chapter_title": "Chapter 1: Scaling, Performance & Latency",
                "lessons": [
                    ("Introduction to Distributed System Design", "video", 20, "https://www.youtube.com/embed/m8IOf_o9C0Y", "### Systems Scale\n\nScaling systems requires understanding bottlenecks, bandwidth, latency, and throughput.\n\n* **Horizontal Scale**: Adding more nodes.\n* **Vertical Scale**: Upgrading existing hardware.\n* **Fault Tolerance**: Avoid single points of failure."),
                    ("Load Balancing, Proxies and Latency Reduction", "article", 18, None, "### Load Balancing Algorithms\n\nLoad balancers distribute user traffic to web servers:\n\n* **Round Robin**: Sequential round robin queue.\n* **Least Connections**: Routing to server with lowest connection count.\n* **IP Hash**: Hashing client IP to route consistently."),
                    ("Coding Lab: Creating a local API Rate Limiter", "coding", 25, None, "### System Design Lab\n\nDesign a simple sliding-window API Rate Limiter mapping IP hits:\n\n```python\nimport time\n\nclass RateLimiter:\n    def __init__(self, limit: int, window: int):\n        self.limit = limit\n        self.window = window\n        self.history = {}\n```"),
                ]
            },
            "software-testing": {
                "module_title": "Module 1: High Quality Testing",
                "chapter_title": "Chapter 1: Writing Test Suites & Mocking",
                "lessons": [
                    ("Software Testing Principles & CI/CD", "video", 12, "https://www.youtube.com/embed/y2em3E56dD8", "### Code Quality\n\nTesting guarantees safety of code during automated CI/CD deployments.\n\n* **Unit Tests**: Isolated unit validations.\n* **Integration Tests**: Group/component verification.\n* **End-to-End Tests**: Complete flow assertions."),
                    ("Mocking APIs & Assertions with PyTest", "article", 15, None, "### Mocking & PyTest fixtures\n\nFixtures initialize state before executing test blocks:\n\n```python\nimport pytest\n\n@pytest.fixture\ndef client():\n    return \"Test Client Instance\"\n\ndef test_client_status(client):\n    assert client == \"Test Client Instance\"\n```"),
                    ("TDD: Practicing Red-Green-Refactor cycle", "coding", 20, None, "### Lab Exercise\n\nWrite a test suite for a function that parses credentials. Ensure it fails first (Red), passes (Green), then refactor it."),
                ]
            },
            "nextjs-masterclass": {
                "module_title": "Module 1: Server and Client Components",
                "chapter_title": "Chapter 1: Routing, Layouts & Performance",
                "lessons": [
                    ("Next.js App Router Core Concepts", "video", 15, "https://www.youtube.com/embed/tS0yM44C8uE", "### Next.js App Router\n\nNext.js App Router provides dynamic server-rendering, parallel routes, and intercepted views.\n\n* **Server Components**: Rendered on the server by default.\n* **Client Components**: Hydrated dynamically on the browser.\n* **Zero Bundle Size**: Server components do not ship javascript to browsers."),
                    ("Configuring Layouts, Nested Routing & Metadata", "article", 18, None, "### Layout Nesting\n\nLayouts persist state during navigations:\n\n```tsx\nexport default function Layout({ children }: { children: React.ReactNode }) {\n  return (\n    <div className=\"dashboard-container\">\n      <Sidebar />\n      <main>{children}</main>\n    </div>\n  );\n}\n```"),
                    ("Coding: Optimizing server actions and data loading", "coding", 20, None, "### Interactive Lab\n\nBuild a server action endpoint to trigger a database reload:\n\n```typescript\n'use server';\n\nexport async function updateDatabaseRecord(id: string) {\n  // database mutation operations...\n}\n```"),
                ]
            }
        }

        for title, slug, desc, short, diff, hours in courses_data:
            res = await db.execute(text("SELECT id FROM courses WHERE slug = :slug"), {"slug": slug})
            row = res.fetchone()
            if row:
                cid = row[0]
            else:
                cid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO courses (id, tenant_id, title, slug, description, short_description,
                        difficulty_level, estimated_duration_hours, language, is_published, is_free,
                        enrollment_count, rating, version, created_at, updated_at)
                    VALUES (:id, :tid, :title, :slug, :desc, :short, :diff, :hours, 'en', true, true, 42, 4.7, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": cid, "tid": org_id, "title": title, "slug": slug, "desc": desc, "short": short, "diff": diff, "hours": hours
                })
            
            # Fetch curriculum metadata
            curriculum = course_curriculums.get(slug, {
                "module_title": f"{title} Basics",
                "chapter_title": "Chapter 1: Getting Started",
                "lessons": [
                    ("Introduction and Setup", "article", 10, None, f"### Setup\n\nGetting started with {title}."),
                    ("Core Concepts and Syntax", "video", 15, "https://www.youtube.com/embed/dQw4w9WgXcQ", f"### Concepts\n\nLearning core parameters."),
                    ("Interactive Practice Lab", "coding", 20, None, f"### Practice Lab\n\nComplete practical exercise.")
                ]
            })

            # Clean up old modules that are not in the current curriculum
            res_m_old = await db.execute(text("SELECT id, title FROM modules WHERE course_id = :cid"), {"cid": cid})
            for mid_old, mtitle_old in res_m_old.fetchall():
                if mtitle_old != curriculum["module_title"]:
                    # Delete old chapters and lessons first to avoid FK constraints
                    res_ch_old = await db.execute(text("SELECT id FROM chapters WHERE module_id = :mid"), {"mid": mid_old})
                    for (chid_old,) in res_ch_old.fetchall():
                        await db.execute(text("DELETE FROM lessons WHERE chapter_id = :chid"), {"chid": chid_old})
                        await db.execute(text("DELETE FROM chapters WHERE id = :chid"), {"chid": chid_old})
                    await db.execute(text("DELETE FROM modules WHERE id = :mid"), {"mid": mid_old})

            # Module
            res = await db.execute(text("SELECT id FROM modules WHERE course_id = :cid AND title = :title"), {"cid": cid, "title": curriculum["module_title"]})
            row_mod = res.fetchone()
            if row_mod:
                mid = row_mod[0]
            else:
                mid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO modules (id, tenant_id, course_id, title, order_index, estimated_duration_minutes, created_at, updated_at)
                    VALUES (:id, :tid, :cid, :title, 0, 180, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {"id": mid, "tid": org_id, "cid": cid, "title": curriculum["module_title"]})
                
            # Chapter
            res = await db.execute(text("SELECT id FROM chapters WHERE module_id = :mid AND title = :title"), {"mid": mid, "title": curriculum["chapter_title"]})
            row_ch = res.fetchone()
            if row_ch:
                chid = row_ch[0]
            else:
                chid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO chapters (id, tenant_id, module_id, title, order_index, estimated_duration_minutes, created_at, updated_at)
                    VALUES (:id, :tid, :mid, :title, 0, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {"id": chid, "tid": org_id, "mid": mid, "title": curriculum["chapter_title"]})
                
            # Map course slug to skill slug
            skill_slug_map = {
                "full-stack-python": "python-basics",
                "modern-react": "reactjs",
                "fastapi-web": "fastapi-basics",
                "docker-dev": "docker-basics",
                "sql-mastery": "sql-basics",
                "ml-foundations": "ml-basics",
                "typescript-essentials": "typescript",
                "advanced-system-design": "system-design",
                "software-testing": "software-testing",
                "nextjs-masterclass": "nextjs-router",
            }
            skill_slug = skill_slug_map.get(slug, "python-basics")
            res_s = await db.execute(text("SELECT id FROM skills WHERE slug = :slug"), {"slug": skill_slug})
            row_s = res_s.fetchone()
            skill_id_str = str(row_s[0]) if row_s else None
            skill_ids_json = f'["{skill_id_str}"]' if skill_id_str else '[]'

            # Lessons
            for idx, (ltitle, ltype, ldur, lurl, lbody) in enumerate(curriculum["lessons"]):
                res = await db.execute(text("SELECT id FROM lessons WHERE chapter_id = :chid AND title = :title"), {"chid": chid, "title": ltitle})
                row_l = res.fetchone()
                if row_l:
                    await db.execute(text("""
                        UPDATE lessons SET content_type = :ct, order_index = :idx, estimated_duration_minutes = :dur,
                            difficulty_level = :diff, content_url = :url, content_body = :body, skill_ids = :skill_ids
                        WHERE id = :lid
                    """), {
                        "lid": row_l[0], "ct": ltype, "idx": idx, "dur": ldur, "diff": diff,
                        "url": lurl, "body": lbody, "skill_ids": skill_ids_json
                    })
                else:
                    await db.execute(text("""
                        INSERT INTO lessons (id, tenant_id, chapter_id, title, content_type, order_index,
                            estimated_duration_minutes, difficulty_level, content_url, content_body, skill_ids, created_at, updated_at)
                        VALUES (:id, :tid, :chid, :title, :ct, :idx, :dur, :diff, :url, :body, :skill_ids, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """), {
                        "id": str(uuid.uuid4()), "tid": org_id, "chid": chid,
                        "title": ltitle, "ct": ltype, "idx": idx, "dur": ldur, "diff": diff,
                        "url": lurl, "body": lbody, "skill_ids": skill_ids_json
                    })
                
            # Assessment
            res = await db.execute(text("SELECT id FROM assessments WHERE title = :title"), {"title": f"{title} Diagnostics"})
            row_as = res.fetchone()
            if row_as:
                aid = row_as[0]
            else:
                aid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO assessments (id, tenant_id, title, assessment_type, passing_score,
                        max_attempts, is_adaptive, question_count, is_published, created_at, updated_at)
                    VALUES (:id, :tid, :title, 'quiz', 0.7, 3, true, 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {"id": aid, "tid": org_id, "title": f"{title} Diagnostics"})
                
            # Questions (3 per assessment)
            questions = [
                (f"What is the primary use case of {title}?", "multiple_choice", 1, "remember",
                 '["To build backend systems", "To containerize code", "General software engineering", "None of the above"]', "General software engineering"),
                (f"Which of these is a core component of {title}?", "multiple_choice", 1, "apply",
                 '["Component A", "Component B", "Component C", "All of the above"]', "All of the above"),
                (f"True or False: {title} is considered beginner-friendly.", "multiple_choice", 1, "evaluate",
                 '["True", "False"]', "True"),
            ]
            for idx, (qcontent, qtype, qdiff, blooms, options, answer) in enumerate(questions):
                res = await db.execute(text("SELECT id FROM questions WHERE assessment_id = :aid AND order_index = :idx"), {"aid": aid, "idx": idx})
                if not res.fetchone():
                    await db.execute(text("""
                        INSERT INTO questions (id, tenant_id, assessment_id, content, question_type,
                            difficulty_level, blooms_level, estimated_time_seconds, correct_answer, order_index, created_at, updated_at)
                        VALUES (:id, :tid, :aid, :content, :qtype, :diff, :blooms, 30, :answer, :idx, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """), {
                        "id": str(uuid.uuid4()), "tid": org_id, "aid": aid,
                        "content": qcontent, "qtype": qtype, "diff": qdiff, "blooms": blooms,
                        "answer": answer, "idx": idx
                    })
                
        print(f"✅ Courses, modules, chapters, lessons, assessments, questions seeded successfully")

        # ── 9. Badges (10 Badges) ──
        badge_data = [
            ("First Steps", "Complete your first lesson", "🌱", "milestone"),
            ("Quiz Master", "Score 100% on 3 quizzes", "🏅", "skill"),
            ("Streak Warrior", "Maintain a 7-day streak", "🔥", "consistency"),
            ("Explorer", "Try 5 different skill areas", "🔍", "exploration"),
            ("Code Ninja", "Complete a coding challenge", "🥷", "skill"),
            ("Bug Hunter", "Find and resolve 3 testing issues", "🐛", "quality"),
            ("Pythonista", "Master all Python skills", "🐍", "skill"),
            ("Fast Learner", "Complete a module in 1 day", "⚡", "milestone"),
            ("UI Specialist", "Build 3 clean layouts", "🎨", "design"),
            ("DevOps Champ", "Deploy your first container", "🐳", "devops"),
        ]
        badge_ids = {}
        for name, desc, icon, cat in badge_data:
            res = await db.execute(text("SELECT id FROM badges WHERE name = :name"), {"name": name})
            row = res.fetchone()
            if row:
                bid = row[0]
            else:
                bid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO badges (id, tenant_id, name, description, icon_url, category, created_at, updated_at)
                    VALUES (:id, :tid, :name, :desc, :icon, :cat, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": bid, "tid": org_id,
                    "name": name, "desc": desc, "icon": icon, "cat": cat,
                })
            badge_ids[name] = bid
        print(f"✅ Badges: {len(badge_data)} created/verified")

        # ── 10. XP Events (10 XP events per student) ──
        base_xp_events = [
            (30, "Completed: Introduction to Python", "lesson_complete"),
            (25, "Completed: Variables and Assignment", "lesson_complete"),
            (50, "Passed: Python Diagnostic Assessment", "assessment_pass"),
            (15, "Daily streak bonus", "streak_bonus"),
            (20, "Completed: Data Types lesson", "lesson_complete"),
            (10, "Practice session: Type Conversion", "practice"),
            (35, "Earned badge: First Steps", "badge_earned"),
            (15, "Check-in attendance bonus", "attendance"),
            (40, "Completed: FastAPI Basics", "lesson_complete"),
            (50, "Passed: React Diagnostic", "assessment_pass"),
        ]
        xp_events_count = 0
        for idx, profile_id in enumerate(student_profiles):
            for amount, reason, source_type in base_xp_events:
                res = await db.execute(text("SELECT id FROM xp_events WHERE learner_id = :lid AND reason = :reason"), {"lid": profile_id, "reason": reason})
                if not res.fetchone():
                    days_ago = 1 + (idx % 3)
                    await db.execute(text("""
                        INSERT INTO xp_events (id, learner_id, tenant_id, amount, reason, source_type, source_id, created_at)
                        VALUES (:id, :lid, :tid, :amount, :reason, :src, :srcid, CURRENT_TIMESTAMP - :days * INTERVAL '1 day')
                    """), {
                        "id": str(uuid.uuid4()), "lid": profile_id, "tid": org_id,
                        "amount": amount, "reason": reason, "src": source_type,
                        "srcid": str(uuid.uuid4()), "days": days_ago,
                    })
                    xp_events_count += 1
        print(f"✅ XP Events: {xp_events_count} new events seeded")

        # ── 11. Quests (3 Quests per student) ──
        quests_data = [
            ("Python Foundations", "Complete 3 Python lessons this week", "weekly", 75, 50),
            ("Daily Learner", "Study for at least 15 minutes today", "daily", 60, 20),
            ("Assessment Ace", "Score 80%+ on Python Diagnostic", "challenge", 30, 100),
        ]
        quests_count = 0
        for profile_id in student_profiles:
            for title, desc, qtype, progress, xp in quests_data:
                res = await db.execute(text("SELECT id FROM quests WHERE learner_id = :lid AND title = :title"), {"lid": profile_id, "title": title})
                if not res.fetchone():
                    await db.execute(text("""
                        INSERT INTO quests (id, learner_id, tenant_id, title, description, quest_type, xp_reward, progress_percentage, is_completed, created_at, updated_at)
                        VALUES (:id, :lid, :tid, :title, :desc, :qtype, :xp, :prog, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """), {
                        "id": str(uuid.uuid4()), "lid": profile_id, "tid": org_id,
                        "title": title, "desc": desc, "qtype": qtype, "xp": xp, "prog": progress,
                    })
                    quests_count += 1
        print(f"✅ Quests: {quests_count} new quests seeded")

        # ── 12. Learner Badges (Award First Steps badge to all students) ──
        earned_badges_count = 0
        if "First Steps" in badge_ids:
            for profile_id in student_profiles:
                res = await db.execute(text("SELECT id FROM learner_badges WHERE learner_id = :lid AND badge_id = :bid"), {"lid": profile_id, "bid": badge_ids["First Steps"]})
                if not res.fetchone():
                    await db.execute(text("""
                        INSERT INTO learner_badges (id, learner_id, badge_id, tenant_id, earned_at, reason)
                        VALUES (:id, :lid, :bid, :tid, CURRENT_TIMESTAMP - INTERVAL '2 days', 'Completed first lesson')
                    """), {
                        "id": str(uuid.uuid4()), "lid": profile_id,
                        "bid": badge_ids["First Steps"], "tid": org_id,
                    })
                    earned_badges_count += 1
        print(f"✅ Badges earned: {earned_badges_count} new badges awarded")

        # ── 13. Access Requests (10 access requests) ──
        access_requests = [
            ("Alice Smith", "alice.smith@hcl.com", "HCL Tech", "Requesting platform trial for training."),
            ("Brad Pitt", "brad@cinema.org", "Cinema Inc", "Testing full-stack system."),
            ("Chris Evans", "evans@marvel.com", "Marvel Studio", "Evaluating learning tool."),
            ("David Banner", "hulk@avengers.org", "Gamma Labs", "Need learning resource for radiation physics."),
            ("Emily Blunt", "emily@hollywood.com", "Hollywood Acad", "Reviewing UI components."),
            ("Frank Castle", "punisher@vigilante.net", "Castle Corp", "Looking for DevOps deployment courses."),
            ("Gwen Stacy", "gwen@oscop.com", "Oscorp", "Need machine learning tools for genetics research."),
            ("Harry Osborn", "harry@oscorp.com", "Oscorp", "Assessing learning path tracking."),
            ("Irene Adler", "irene@adler.io", "Adler Consulting", "Testing REST API endpoints security."),
            ("John Watson", "watson@sherlock.co.uk", "Baker St Medical", "Need platform access for training medical assistants.")
        ]
        access_req_count = 0
        for idx, (name, email, company, reason) in enumerate(access_requests):
            res = await db.execute(text("SELECT id FROM access_requests WHERE email = :email"), {"email": email})
            if not res.fetchone():
                status = "pending" if idx % 2 == 0 else "approved"
                await db.execute(text("""
                    INSERT INTO access_requests (id, full_name, email, company, reason, status, created_at, updated_at)
                    VALUES (:id, :name, :email, :company, :reason, :status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": str(uuid.uuid4()), "name": name, "email": email, "company": company, "reason": reason, "status": status
                })
                access_req_count += 1
        print(f"✅ Access requests: {access_req_count} new requests seeded")

        # ── 14. Attendance Sessions & Records (10 sessions, each with 8 records) ──
        teacher_id = teacher_ids[0]
        sessions_count = 0
        records_count = 0
        for i in range(1, 11):
            session_title = f"Lecture {i}: Interactive Discussion"
            session_date_str = (date.today() - timedelta(days=i)).strftime("%Y-%m-%d")
            
            res = await db.execute(text("SELECT id FROM attendance_sessions WHERE teacher_id = :tid AND title = :title"), {"tid": teacher_id, "title": session_title})
            row_sess = res.fetchone()
            if row_sess:
                session_id = row_sess[0]
            else:
                session_id = str(uuid.uuid4())
                start_time = datetime.now(timezone.utc) - timedelta(days=i, hours=1)
                end_time = datetime.now(timezone.utc) - timedelta(days=i)
                await db.execute(text("""
                    INSERT INTO attendance_sessions (id, tenant_id, teacher_id, title, session_date, start_time, end_time, status, verification_method, created_at, updated_at)
                    VALUES (:id, :tid, :teacher_id, :title, :sdate, :start, :end, 'completed', 'otp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": session_id, "tid": org_id, "teacher_id": teacher_id, "title": session_title,
                    "sdate": session_date_str, "start": start_time, "end": end_time
                })
                sessions_count += 1
            
            # Seed attendance record for each student
            for idx, sid in enumerate(student_ids):
                res = await db.execute(text("SELECT id FROM attendance_records WHERE session_id = :sess_id AND student_id = :stud_id"), {"sess_id": session_id, "stud_id": sid})
                if not res.fetchone():
                    status = "present" if (i + idx) % 5 != 0 else "absent"
                    await db.execute(text("""
                        INSERT INTO attendance_records (id, tenant_id, session_id, student_id, status, verification_method, is_verified, created_at, updated_at)
                        VALUES (:id, :tid, :sess_id, :stud_id, :status, 'otp', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """), {
                        "id": str(uuid.uuid4()), "tid": org_id, "sess_id": session_id, "stud_id": sid, "status": status
                    })
                    records_count += 1
        print(f"✅ Attendance sessions: {sessions_count} new sessions, {records_count} new student check-ins seeded")

        await db.commit()

    print("\n🎉 Seed complete!")
    print("  Login credentials:")
    print("    admin@learnit.dev / Password1!")
    print("    teacher@learnit.dev / Password1!")
    print("    student@learnit.dev / Password1!")
    print("    student[2-8]@learnit.dev / Password1!")


if __name__ == "__main__":
    asyncio.run(seed())
