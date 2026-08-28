"""
Seed Data Script — Populates the database with demo data.

Creates: organization, users (admin, teacher, student),
skills, skill relationships, courses, lessons, assessments, badges, quests,
learner profiles, mastery states, XP events, goals.
"""

import asyncio
import uuid
from datetime import datetime, timezone, timedelta, date

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
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created")

    async with async_session_factory() as db:
        # ── Organization ──
        org_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT OR IGNORE INTO organizations (id, name, slug, tenant_type, is_active, created_at, updated_at)
            VALUES (:id, :name, :slug, :type, 1, datetime('now'), datetime('now'))
        """), {
            "id": org_id, "name": "Learn-it HCL Demo",
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
            uid = str(uuid.uuid4())
            user_ids[u["role"]] = uid
            await db.execute(text("""
                INSERT OR IGNORE INTO users (id, tenant_id, email, hashed_password, full_name, role, is_active, is_verified, created_at, updated_at)
                VALUES (:id, :tid, :email, :pwd, :name, :role, 1, 1, datetime('now'), datetime('now'))
            """), {
                "id": uid, "tid": org_id, "email": u["email"],
                "pwd": pwd, "name": u["name"], "role": u["role"],
            })
            print(f"  ✅ User: {u['email']} (pwd: Password1!)")

        # ── Learner Profile for student ──
        student_id = user_ids["student"]
        profile_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT OR IGNORE INTO learner_profiles (id, user_id, tenant_id, language, timezone, locale, onboarding_completed, created_at, updated_at)
            VALUES (:id, :uid, :tid, 'en', 'UTC', 'en-US', 1, datetime('now'), datetime('now'))
        """), {"id": profile_id, "uid": student_id, "tid": org_id})
        print(f"  ✅ Learner profile for student")

        # ── Learner Goal ──
        goal_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT OR IGNORE INTO learner_goals (id, learner_id, tenant_id, title, goal_type, target_role, time_horizon_weeks, hours_per_week, is_active, progress_percentage, created_at, updated_at)
            VALUES (:id, :lid, :tid, 'Become a Full-Stack Python Developer', 'career', 'Backend Engineer', 12, 10, 1, 35.0, datetime('now'), datetime('now'))
        """), {"id": goal_id, "lid": profile_id, "tid": org_id})
        print(f"  ✅ Learner goal: Full-Stack Python Developer")

        # ── Skills ──
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
            skill_ids[slug] = sid
            await db.execute(text("""
                INSERT OR IGNORE INTO skills (id, tenant_id, name, slug, category, difficulty_level, is_active, created_at, updated_at)
                VALUES (:id, :tid, :name, :slug, :cat, :diff, 1, datetime('now'), datetime('now'))
            """), {
                "id": sid, "tid": org_id, "name": name,
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
                    INSERT OR IGNORE INTO skill_relationships (id, tenant_id, source_skill_id, target_skill_id, relationship_type, strength)
                    VALUES (:id, :tid, :src, :tgt, 'prerequisite', 1.0)
                """), {
                    "id": str(uuid.uuid4()), "tid": org_id,
                    "src": skill_ids[source], "tgt": skill_ids[target],
                })
        print(f"  ✅ Skill prerequisites: {len(prereqs)} created")

        # ── Mastery States for student ──
        mastery_data = [
            ("python-basics", 0.82, 0.9, "mastered", 8),
            ("data-structures", 0.55, 0.7, "learning", 5),
            ("sql-fundamentals", 0.45, 0.6, "learning", 3),
            ("rest-apis", 0.30, 0.5, "learning", 2),
            ("git-github", 0.75, 0.85, "practiced", 6),
            ("testing", 0.20, 0.4, "learning", 1),
            ("docker", 0.10, 0.3, "not_started", 0),
            ("typescript", 0.35, 0.55, "learning", 2),
        ]
        for slug, score, confidence, status, evidence_count in mastery_data:
            if slug in skill_ids:
                await db.execute(text("""
                    INSERT OR IGNORE INTO mastery_states (id, learner_id, skill_id, tenant_id, mastery_score, confidence, evidence_count, status, retention_estimate, difficulty_estimate, last_assessed_at, created_at, updated_at)
                    VALUES (:id, :lid, :sid, :tid, :score, :conf, :ev, :status, 0.9, 0.5, datetime('now', '-1 day'), datetime('now'), datetime('now'))
                """), {
                    "id": str(uuid.uuid4()), "lid": student_id,
                    "sid": skill_ids[slug], "tid": org_id,
                    "score": score, "conf": confidence,
                    "ev": evidence_count, "status": status,
                })
        print(f"  ✅ Mastery states: {len(mastery_data)} created")

        # ── Course ──
        course_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT OR IGNORE INTO courses (id, tenant_id, title, slug, description, short_description,
                difficulty_level, estimated_duration_hours, language, is_published, is_free,
                enrollment_count, rating, version, created_at, updated_at)
            VALUES (:id, :tid, :title, :slug, :desc, :short, 'beginner', 20, 'en',
                1, 1, 42, 4.7, 1, datetime('now'), datetime('now'))
        """), {
            "id": course_id, "tid": org_id,
            "title": "Full-Stack Python Developer",
            "slug": "full-stack-python",
            "desc": "Master Python, FastAPI, SQL, and React to build production web applications.",
            "short": "From Python basics to full-stack mastery",
        })

        # Module + Chapters + Lessons
        module_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT OR IGNORE INTO modules (id, tenant_id, course_id, title, order_index, estimated_duration_minutes, created_at, updated_at)
            VALUES (:id, :tid, :cid, 'Python Foundations', 0, 180, datetime('now'), datetime('now'))
        """), {"id": module_id, "tid": org_id, "cid": course_id})

        chapter_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT OR IGNORE INTO chapters (id, tenant_id, module_id, title, order_index, estimated_duration_minutes, created_at, updated_at)
            VALUES (:id, :tid, :mid, 'Variables and Data Types', 0, 45, datetime('now'), datetime('now'))
        """), {"id": chapter_id, "tid": org_id, "mid": module_id})

        lessons_data = [
            ("Introduction to Python", "article", 10),
            ("Variables and Assignment", "interactive", 15),
            ("Data Types: Strings, Numbers, Booleans", "video", 12),
            ("Practice: Type Conversion", "coding", 8),
        ]
        for i, (title, content_type, duration) in enumerate(lessons_data):
            await db.execute(text("""
                INSERT OR IGNORE INTO lessons (id, tenant_id, chapter_id, title, content_type, order_index,
                    estimated_duration_minutes, difficulty_level, created_at, updated_at)
                VALUES (:id, :tid, :chid, :title, :ct, :idx, :dur, 'beginner', datetime('now'), datetime('now'))
            """), {
                "id": str(uuid.uuid4()), "tid": org_id, "chid": chapter_id,
                "title": title, "ct": content_type, "idx": i, "dur": duration,
            })
        print(f"  ✅ Course: Full-Stack Python Developer (4 lessons)")

        # ── Assessment ──
        assessment_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT OR IGNORE INTO assessments (id, tenant_id, title, assessment_type, passing_score,
                max_attempts, is_adaptive, question_count, is_published, created_at, updated_at)
            VALUES (:id, :tid, 'Python Diagnostic', 'diagnostic', 0.6, 1, 1, 5, 1, datetime('now'), datetime('now'))
        """), {"id": assessment_id, "tid": org_id})

        questions = [
            ("What is the output of: print(type(3.14))?", "multiple_choice", 1, "remember",
             '["<class float>", "<class int>", "<class str>", "<class number>"]', "<class float>"),
            ("Which keyword is used to define a function in Python?", "multiple_choice", 1, "remember",
             '["def", "func", "function", "define"]', "def"),
            ("What does `len([1, 2, 3])` return?", "multiple_choice", 1, "apply",
             '["3", "2", "1", "Error"]', "3"),
        ]
        for i, (content, qtype, diff, blooms, options, answer) in enumerate(questions):
            await db.execute(text("""
                INSERT OR IGNORE INTO questions (id, tenant_id, assessment_id, content, question_type,
                    difficulty_level, blooms_level, estimated_time_seconds, correct_answer, order_index, created_at, updated_at)
                VALUES (:id, :tid, :aid, :content, :qtype, :diff, :blooms, 30, :answer, :idx, datetime('now'), datetime('now'))
            """), {
                "id": str(uuid.uuid4()), "tid": org_id, "aid": assessment_id,
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
        badge_ids = {}
        for name, desc, icon, cat in badge_data:
            bid = str(uuid.uuid4())
            badge_ids[name] = bid
            await db.execute(text("""
                INSERT OR IGNORE INTO badges (id, tenant_id, name, description, icon_url, category, created_at, updated_at)
                VALUES (:id, :tid, :name, :desc, :icon, :cat, datetime('now'), datetime('now'))
            """), {
                "id": bid, "tid": org_id,
                "name": name, "desc": desc, "icon": icon, "cat": cat,
            })
        print(f"  ✅ Badges: {len(badge_data)} created")

        # ── XP Events for student ──
        xp_events = [
            (30, "Completed: Introduction to Python", "lesson_complete"),
            (25, "Completed: Variables and Assignment", "lesson_complete"),
            (50, "Passed: Python Diagnostic Assessment", "assessment_pass"),
            (15, "Daily streak bonus (Day 5)", "streak_bonus"),
            (20, "Completed: Data Types lesson", "lesson_complete"),
            (10, "Practice session: Type Conversion", "practice"),
            (35, "Earned badge: First Steps", "badge_earned"),
            (15, "Check-in attendance bonus", "attendance"),
        ]
        for amount, reason, source_type in xp_events:
            await db.execute(text("""
                INSERT OR IGNORE INTO xp_events (id, learner_id, tenant_id, amount, reason, source_type, source_id, created_at)
                VALUES (:id, :lid, :tid, :amount, :reason, :src, :srcid, datetime('now', '-' || :days || ' days'))
            """), {
                "id": str(uuid.uuid4()), "lid": student_id, "tid": org_id,
                "amount": amount, "reason": reason, "src": source_type,
                "srcid": str(uuid.uuid4()), "days": str(len(xp_events) - xp_events.index((amount, reason, source_type))),
            })
        print(f"  ✅ XP Events: {len(xp_events)} created")

        # ── Streak for student ──
        await db.execute(text("""
            INSERT OR IGNORE INTO streaks (id, learner_id, tenant_id, current_count, longest_count, last_activity_date, freeze_count, is_active, created_at, updated_at)
            VALUES (:id, :lid, :tid, 5, 8, date('now'), 2, 1, datetime('now'), datetime('now'))
        """), {"id": str(uuid.uuid4()), "lid": student_id, "tid": org_id})
        print(f"  ✅ Streak: 5-day active streak")

        # ── Quests for student ──
        quests = [
            ("Python Foundations", "Complete 3 Python lessons this week", "weekly", 75, 50),
            ("Daily Learner", "Study for at least 15 minutes today", "daily", 60, 20),
            ("Assessment Ace", "Score 80%+ on Python Diagnostic", "challenge", 30, 100),
        ]
        for title, desc, qtype, progress, xp in quests:
            await db.execute(text("""
                INSERT OR IGNORE INTO quests (id, learner_id, tenant_id, title, description, quest_type, xp_reward, progress_percentage, is_completed, created_at, updated_at)
                VALUES (:id, :lid, :tid, :title, :desc, :qtype, :xp, :prog, 0, datetime('now'), datetime('now'))
            """), {
                "id": str(uuid.uuid4()), "lid": student_id, "tid": org_id,
                "title": title, "desc": desc, "qtype": qtype, "xp": xp, "prog": progress,
            })
        print(f"  ✅ Quests: {len(quests)} created")

        # ── Learner Badge (earned) ──
        if "First Steps" in badge_ids:
            await db.execute(text("""
                INSERT OR IGNORE INTO learner_badges (id, learner_id, badge_id, tenant_id, earned_at, reason)
                VALUES (:id, :lid, :bid, :tid, datetime('now', '-2 days'), 'Completed first lesson')
            """), {
                "id": str(uuid.uuid4()), "lid": student_id,
                "bid": badge_ids["First Steps"], "tid": org_id,
            })
            print(f"  ✅ Badge earned: First Steps")

        await db.commit()

    print("\n🎉 Seed complete!")
    print("  Login credentials:")
    print("    admin@learnit.dev / Password1!")
    print("    teacher@learnit.dev / Password1!")
    print("    student@learnit.dev / Password1!")


if __name__ == "__main__":
    asyncio.run(seed())
