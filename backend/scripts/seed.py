"""
Seed Data Script — Populates the database with demo data.

Creates: organization, users (admin, teacher, student),
skills, skill relationships, courses, lessons, assessments, badges, quests.
"""

import asyncio
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import text
from app.database import engine, async_session_factory, Base
from app.core.security import hash_password

# Import ALL models so Base.metadata sees every table
import app.modules.identity.models  # noqa
import app.modules.skills.models  # noqa
import app.modules.content.models  # noqa
import app.modules.learners.models  # noqa
import app.modules.mastery.models  # noqa
import app.modules.assessments.models  # noqa
import app.modules.gamification.models  # noqa
import app.modules.attendance.router  # noqa  (models are inline in router)


async def seed():
    """Seed the database with demo data."""
    print("🌱 Starting seed...")

    # Create tables
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created")

    async with async_session_factory() as db:
        # ── Organization ──
        org_id = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO organizations (id, name, slug, tenant_type, is_active, created_at, updated_at)
            VALUES (:id, :name, :slug, :type, true, NOW(), NOW())
            ON CONFLICT (slug) DO NOTHING
        """), {
            "id": str(org_id), "name": "Learn-it HCL Demo",
            "slug": "learnit-demo", "type": "standalone",
        })
        print(f"✅ Organization: learnit-demo ({org_id})")

        # ── Users ──
        users = [
            {"name": "Admin User", "email": "admin@learnit.dev", "role": "admin"},
            {"name": "Teacher Smith", "email": "teacher@learnit.dev", "role": "teacher"},
            {"name": "Student Demo", "email": "student@learnit.dev", "role": "student"},
        ]
        pwd = hash_password("Password1!")
        user_ids = {}
        for u in users:
            uid = uuid.uuid4()
            user_ids[u["role"]] = uid
            await db.execute(text("""
                INSERT INTO users (id, tenant_id, email, hashed_password, full_name, role, is_active, is_verified, created_at, updated_at)
                VALUES (:id, :tid, :email, :pwd, :name, :role, true, true, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uid), "tid": str(org_id), "email": u["email"],
                "pwd": pwd, "name": u["name"], "role": u["role"],
            })
            print(f"  ✅ User: {u['email']} (pwd: Password1!)")

        # ── Skills ──
        skills = [
            ("Python Basics", "python-basics", "programming", 1),
            ("Data Structures", "data-structures", "programming", 2),
            ("SQL Fundamentals", "databases", "databases", 1),
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
            sid = uuid.uuid4()
            skill_ids[slug] = sid
            await db.execute(text("""
                INSERT INTO skills (id, tenant_id, name, slug, category, difficulty_level, is_active, created_at, updated_at)
                VALUES (:id, :tid, :name, :slug, :cat, :diff, true, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """), {
                "id": str(sid), "tid": str(org_id), "name": name,
                "slug": slug, "cat": category, "diff": difficulty,
            })
        print(f"  ✅ Skills: {len(skills)} created")

        # ── Skill Relationships (Prerequisites) ──
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
                await db.execute(text("""
                    INSERT INTO skill_relationships (id, tenant_id, source_skill_id, target_skill_id, relationship_type, strength)
                    VALUES (:id, :tid, :src, :tgt, 'prerequisite', 1.0)
                    ON CONFLICT DO NOTHING
                """), {
                    "id": str(uuid.uuid4()), "tid": str(org_id),
                    "src": str(skill_ids[source]), "tgt": str(skill_ids[target]),
                })
        print(f"  ✅ Skill prerequisites: {len(prereqs)} created")

        # ── Course ──
        course_id = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO courses (id, tenant_id, title, slug, description, short_description,
                difficulty_level, estimated_duration_hours, language, is_published, is_free,
                enrollment_count, rating, version, created_at, updated_at)
            VALUES (:id, :tid, :title, :slug, :desc, :short, 'beginner', 20, 'en',
                true, true, 42, 4.7, 1, NOW(), NOW())
            ON CONFLICT DO NOTHING
        """), {
            "id": str(course_id), "tid": str(org_id),
            "title": "Full-Stack Python Developer",
            "slug": "full-stack-python",
            "desc": "Master Python, FastAPI, SQL, and React to build production web applications.",
            "short": "From Python basics to full-stack mastery",
        })

        # Module + Chapters + Lessons
        module_id = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO modules (id, tenant_id, course_id, title, order_index, estimated_duration_minutes, created_at, updated_at)
            VALUES (:id, :tid, :cid, 'Python Foundations', 0, 180, NOW(), NOW())
            ON CONFLICT DO NOTHING
        """), {"id": str(module_id), "tid": str(org_id), "cid": str(course_id)})

        chapter_id = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO chapters (id, tenant_id, module_id, title, order_index, estimated_duration_minutes, created_at, updated_at)
            VALUES (:id, :tid, :mid, 'Variables and Data Types', 0, 45, NOW(), NOW())
            ON CONFLICT DO NOTHING
        """), {"id": str(chapter_id), "tid": str(org_id), "mid": str(module_id)})

        lessons_data = [
            ("Introduction to Python", "article", 10),
            ("Variables and Assignment", "interactive", 15),
            ("Data Types: Strings, Numbers, Booleans", "video", 12),
            ("Practice: Type Conversion", "coding", 8),
        ]
        for i, (title, content_type, duration) in enumerate(lessons_data):
            await db.execute(text("""
                INSERT INTO lessons (id, tenant_id, chapter_id, title, content_type, order_index,
                    estimated_duration_minutes, difficulty_level, created_at, updated_at)
                VALUES (:id, :tid, :chid, :title, :ct, :idx, :dur, 'beginner', NOW(), NOW())
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()), "tid": str(org_id), "chid": str(chapter_id),
                "title": title, "ct": content_type, "idx": i, "dur": duration,
            })
        print(f"  ✅ Course: Full-Stack Python Developer (4 lessons)")

        # ── Assessment ──
        assessment_id = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO assessments (id, tenant_id, title, assessment_type, passing_score,
                max_attempts, is_adaptive, question_count, is_published, created_at, updated_at)
            VALUES (:id, :tid, 'Python Diagnostic', 'diagnostic', 0.6, 1, true, 5, true, NOW(), NOW())
            ON CONFLICT DO NOTHING
        """), {"id": str(assessment_id), "tid": str(org_id)})

        questions = [
            ("What is the output of: print(type(3.14))?", "multiple_choice", 1, "remember",
             '["<class ''float''>", "<class ''int''>", "<class ''str''>", "<class ''number''>"]', "<class 'float'>"),
            ("Which keyword is used to define a function in Python?", "multiple_choice", 1, "remember",
             '["def", "func", "function", "define"]', "def"),
            ("What does `len([1, 2, 3])` return?", "multiple_choice", 1, "apply",
             '["3", "2", "1", "Error"]', "3"),
        ]
        for i, (content, qtype, diff, blooms, options, answer) in enumerate(questions):
            await db.execute(text("""
                INSERT INTO questions (id, tenant_id, assessment_id, content, question_type,
                    difficulty_level, blooms_level, estimated_time_seconds, correct_answer, order_index, created_at, updated_at)
                VALUES (:id, :tid, :aid, :content, :qtype, :diff, :blooms, 30, :answer, :idx, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()), "tid": str(org_id), "aid": str(assessment_id),
                "content": content, "qtype": qtype, "diff": diff, "blooms": blooms,
                "answer": answer, "idx": i,
            })
        print(f"  ✅ Assessment: Python Diagnostic (3 questions)")

        # ── Badges ──
        badge_data = [
            ("First Steps", "Complete your first lesson", "🌱", "milestone"),
            ("Quiz Master", "Score 100% on 3 quizzes", "🏅", "skill"),
            ("Streak Warrior", "Maintain a 7-day streak", "🔥", "consistency"),
            ("Explorer", "Try 5 different skill areas", "🔍", "exploration"),
            ("Code Ninja", "Complete a coding challenge", "🥷", "skill"),
        ]
        for name, desc, icon, cat in badge_data:
            await db.execute(text("""
                INSERT INTO badges (id, tenant_id, name, description, icon_url, category, created_at, updated_at)
                VALUES (:id, :tid, :name, :desc, :icon, :cat, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()), "tid": str(org_id),
                "name": name, "desc": desc, "icon": icon, "cat": cat,
            })
        print(f"  ✅ Badges: {len(badge_data)} created")

        await db.commit()

    print("\n🎉 Seed complete!")
    print("  Login credentials:")
    print("    admin@learnit.dev / Password1!")
    print("    teacher@learnit.dev / Password1!")
    print("    student@learnit.dev / Password1!")


if __name__ == "__main__":
    asyncio.run(seed())
