import uuid
import random
from datetime import datetime, timezone, timedelta, date

sql_statements = []

# Helper to format SQL values
def fmt(val):
    if val is None:
        return 'NULL'
    if isinstance(val, bool):
        return 'true' if val else 'false'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, str):
        return "'" + val.replace("'", "''") + "'"
    return f"'{str(val)}'"

# ── 1. Organizations ──
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
    oid = str(uuid.uuid4())
    sql_statements.append(f"INSERT INTO organizations (id, name, slug, tenant_type, is_active, created_at, updated_at) VALUES ({fmt(oid)}, {fmt(name)}, {fmt(slug)}, 'standalone', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
    org_ids.append(oid)
org_id = org_ids[0]

# ── 2. Users ──
users_to_seed = [
    {"name": "System Admin", "email": "admin@learnit.dev", "role": "admin"},
    {"name": "HCL Org Admin", "email": "admin2@learnit.dev", "role": "admin"},
    {"name": "Instructor Smith", "email": "teacher@learnit.dev", "role": "teacher"},
    {"name": "Instructor Doe", "email": "teacher2@learnit.dev", "role": "teacher"},
    {"name": "Alice Johnson", "email": "student@learnit.dev", "role": "student"},
    {"name": "Bob Miller", "email": "student2@learnit.dev", "role": "student"},
    {"name": "Charlie Davis", "email": "student3@learnit.dev", "role": "student"},
    {"name": "Diana Prince", "email": "student4@learnit.dev", "role": "student"},
    {"name": "Ethan Hunt", "email": "student5@learnit.dev", "role": "student"},
    {"name": "Fiona Gallagher", "email": "student6@learnit.dev", "role": "student"},
    {"name": "George Clark", "email": "student7@learnit.dev", "role": "student"},
    {"name": "Hannah Abbott", "email": "student8@learnit.dev", "role": "student"},
]
pwd = "$2b$10$eNA1n/p8xbhSZ42qllKAKu3bxh3vhRLF3QY4tGKqHePMTCnnpjRiu"

student_ids = []
teacher_ids = []
for u in users_to_seed:
    uid = str(uuid.uuid4())
    sql_statements.append(f"INSERT INTO users (id, tenant_id, email, hashed_password, full_name, role, is_active, is_verified, created_at, updated_at) VALUES ({fmt(uid)}, {fmt(org_id)}, {fmt(u['email'])}, {fmt(pwd)}, {fmt(u['name'])}, {fmt(u['role'])}, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
    if u["role"] == "student":
        student_ids.append(uid)
    elif u["role"] == "teacher":
        teacher_ids.append(uid)

# ── 3. Learner Profiles, Goals, Streaks ──
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
    profile_id = str(uuid.uuid4())
    sql_statements.append(f"INSERT INTO learner_profiles (id, user_id, tenant_id, language, timezone, locale, onboarding_completed, created_at, updated_at) VALUES ({fmt(profile_id)}, {fmt(sid)}, {fmt(org_id)}, 'en', 'UTC', 'en-US', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
    student_profiles.append(profile_id)
    
    goal_title, goal_type, target_role, horizon, hours, progress = student_goals[i % len(student_goals)]
    sql_statements.append(f"INSERT INTO learner_goals (id, learner_id, tenant_id, title, goal_type, target_role, time_horizon_weeks, hours_per_week, is_active, progress_percentage, created_at, updated_at) VALUES ({fmt(str(uuid.uuid4()))}, {fmt(profile_id)}, {fmt(org_id)}, {fmt(goal_title)}, {fmt(goal_type)}, {fmt(target_role)}, {fmt(horizon)}, {fmt(hours)}, true, {fmt(progress)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
    
    current_streak = 2 + (i % 7)
    longest_streak = current_streak + 3
    sql_statements.append(f"INSERT INTO streaks (id, learner_id, tenant_id, current_count, longest_count, last_activity_date, freeze_count, is_active, created_at, updated_at) VALUES ({fmt(str(uuid.uuid4()))}, {fmt(profile_id)}, {fmt(org_id)}, {fmt(current_streak)}, {fmt(longest_streak)}, CURRENT_DATE, 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")

# ── 4. Skills ──
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
    sid = str(uuid.uuid4())
    sql_statements.append(f"INSERT INTO skills (id, tenant_id, name, slug, category, difficulty_level, is_active, created_at, updated_at) VALUES ({fmt(sid)}, {fmt(org_id)}, {fmt(name)}, {fmt(slug)}, {fmt(category)}, {fmt(difficulty)}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
    skill_ids[slug] = sid

# ── 5. Skill Relationships ──
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
        sql_statements.append(f"INSERT INTO skill_relationships (id, tenant_id, source_skill_id, target_skill_id, relationship_type, strength) VALUES ({fmt(str(uuid.uuid4()))}, {fmt(org_id)}, {fmt(skill_ids[source])}, {fmt(skill_ids[target])}, 'prerequisite', 1.0);")

# ── 6. Mastery States ──
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
            adjusted_score = min(1.0, max(0.0, score + (idx * 0.02 - 0.08)))
            adjusted_status = "mastered" if adjusted_score > 0.8 else "practiced" if adjusted_score > 0.6 else "learning" if adjusted_score > 0.2 else "not_started"
            sql_statements.append(f"INSERT INTO mastery_states (id, learner_id, skill_id, tenant_id, mastery_score, confidence, evidence_count, status, retention_estimate, difficulty_estimate, last_assessed_at, created_at, updated_at) VALUES ({fmt(str(uuid.uuid4()))}, {fmt(profile_id)}, {fmt(skill_ids[slug])}, {fmt(org_id)}, {fmt(adjusted_score)}, {fmt(confidence)}, {fmt(evidence)}, {fmt(adjusted_status)}, 0.9, 0.5, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")

# ── 7. Career Roles & Role Skills ──
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
    crole_id = str(uuid.uuid4())
    sql_statements.append(f"INSERT INTO career_roles (id, tenant_id, name, slug, description, category, is_active, created_at, updated_at) VALUES ({fmt(crole_id)}, {fmt(org_id)}, {fmt(name)}, {fmt(slug)}, {fmt(desc)}, {fmt(cat)}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
    for skill_slug, min_mastery in role_skills_mapping.get(slug, []):
        if skill_slug in skill_ids:
            sql_statements.append(f"INSERT INTO role_skills (id, tenant_id, career_role_id, skill_id, importance, minimum_mastery) VALUES ({fmt(str(uuid.uuid4()))}, {fmt(org_id)}, {fmt(crole_id)}, {fmt(skill_ids[skill_slug])}, 'essential', {fmt(min_mastery)});")

# ── 8. Courses, Modules, Chapters, Lessons, Assessments, Questions ──
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
    cid = str(uuid.uuid4())
    sql_statements.append(f"INSERT INTO courses (id, tenant_id, title, slug, description, short_description, difficulty_level, estimated_duration_hours, language, is_published, is_free, enrollment_count, rating, version, created_at, updated_at) VALUES ({fmt(cid)}, {fmt(org_id)}, {fmt(title)}, {fmt(slug)}, {fmt(desc)}, {fmt(short)}, {fmt(diff)}, {fmt(hours)}, 'en', true, true, 42, 4.7, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
    
    mid = str(uuid.uuid4())
    sql_statements.append(f"INSERT INTO modules (id, tenant_id, course_id, title, order_index, estimated_duration_minutes, created_at, updated_at) VALUES ({fmt(mid)}, {fmt(org_id)}, {fmt(cid)}, {fmt(title + ' Basics')}, 0, 180, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
    
    chid = str(uuid.uuid4())
    sql_statements.append(f"INSERT INTO chapters (id, tenant_id, module_id, title, order_index, estimated_duration_minutes, created_at, updated_at) VALUES ({fmt(chid)}, {fmt(org_id)}, {fmt(mid)}, 'Chapter 1: Getting Started', 0, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
    
    skill_slug_map = {"full-stack-python": "python-basics", "modern-react": "reactjs", "fastapi-web": "fastapi-basics"}
    skill_slug = skill_slug_map.get(slug, "python-basics")
    skill_id_str = skill_ids.get(skill_slug)
    skill_ids_json = f'["{skill_id_str}"]' if skill_id_str else '[]'
    
    lessons = [
        ("Introduction and Setup", "article", 10, None, f"### Setup\n\nGetting started with {title}."),
        ("Core Concepts and Syntax", "video", 15, "https://www.youtube.com/embed/dQw4w9WgXcQ", f"### Concepts\n\nLearning core parameters."),
        ("Interactive Practice Lab", "coding", 20, None, f"### Practice Lab\n\nComplete practical exercise.")
    ]
    for idx, (ltitle, ltype, ldur, lurl, lbody) in enumerate(lessons):
        sql_statements.append(f"INSERT INTO lessons (id, tenant_id, chapter_id, title, content_type, order_index, estimated_duration_minutes, difficulty_level, content_url, content_body, skill_ids, created_at, updated_at) VALUES ({fmt(str(uuid.uuid4()))}, {fmt(org_id)}, {fmt(chid)}, {fmt(ltitle)}, {fmt(ltype)}, {fmt(idx)}, {fmt(ldur)}, {fmt(diff)}, {fmt(lurl)}, {fmt(lbody)}, '{skill_ids_json}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
        
    aid = str(uuid.uuid4())
    sql_statements.append(f"INSERT INTO assessments (id, tenant_id, title, assessment_type, passing_score, max_attempts, is_adaptive, question_count, is_published, created_at, updated_at) VALUES ({fmt(aid)}, {fmt(org_id)}, {fmt(title + ' Diagnostics')}, 'quiz', 0.7, 3, true, 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")
    
    questions = [
        (f"What is the primary use case of {title}?", "multiple_choice", 1, "remember", '["To build backend systems", "To containerize code", "General software engineering", "None of the above"]', "General software engineering"),
        (f"Which of these is a core component of {title}?", "multiple_choice", 1, "apply", '["Component A", "Component B", "Component C", "All of the above"]', "All of the above"),
        (f"True or False: {title} is considered beginner-friendly.", "multiple_choice", 1, "evaluate", '["True", "False"]', "True"),
    ]
    for idx, (qcontent, qtype, qdiff, blooms, options, answer) in enumerate(questions):
        sql_statements.append(f"INSERT INTO questions (id, tenant_id, assessment_id, content, question_type, difficulty_level, blooms_level, estimated_time_seconds, correct_answer, options, order_index, created_at, updated_at) VALUES ({fmt(str(uuid.uuid4()))}, {fmt(org_id)}, {fmt(aid)}, {fmt(qcontent)}, {fmt(qtype)}, {fmt(qdiff)}, {fmt(blooms)}, 30, {fmt(answer)}, {fmt(options)}, {fmt(idx)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")

# ── 9. Badges ──
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
for name, desc, icon, cat in badge_data:
    sql_statements.append(f"INSERT INTO badges (id, tenant_id, name, description, icon_url, category, created_at, updated_at) VALUES ({fmt(str(uuid.uuid4()))}, {fmt(org_id)}, {fmt(name)}, {fmt(desc)}, {fmt(icon)}, {fmt(cat)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);")

with open("apps/web/prisma/seed_generated.sql", "w") as f:
    f.write("\n".join(sql_statements))
print("Successfully generated seed_generated.sql with", len(sql_statements), "statements")
