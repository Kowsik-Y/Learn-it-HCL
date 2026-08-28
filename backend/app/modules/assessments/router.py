"""Assessments Module — Router for quizzes, diagnostics, and exams."""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser
from app.modules.assessments.models import Assessment, Question, AssessmentAttempt
from app.modules.mastery.service import MasteryService

router = APIRouter()


class SubmitAnswerRequest(BaseModel):
    question_id: str
    answer: str


class StartAttemptRequest(BaseModel):
    assessment_id: str


@router.get("/")
async def list_assessments(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List available assessments."""
    stmt = select(Assessment).where(
        Assessment.tenant_id == current_user.tenant_id,
        Assessment.is_published == True,
    )
    result = await db.execute(stmt)
    assessments = result.scalars().all()

    return {
        "items": [
            {
                "id": str(a.id),
                "title": a.title,
                "assessment_type": a.assessment_type,
                "question_count": a.question_count,
                "time_limit_minutes": a.time_limit_minutes,
                "passing_score": a.passing_score,
                "is_adaptive": a.is_adaptive,
            }
            for a in assessments
        ]
    }


@router.post("/start")
async def start_assessment(
    data: StartAttemptRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Start an assessment attempt and get the first question."""
    assessment_id = data.assessment_id

    # Create attempt
    attempt = AssessmentAttempt(
        assessment_id=assessment_id,
        learner_id=current_user.id,
        tenant_id=current_user.tenant_id,
        status="in_progress",
        started_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    await db.flush()

    # Get first question
    stmt = select(Question).where(
        Question.assessment_id == assessment_id
    ).order_by(Question.order_index).limit(1)
    result = await db.execute(stmt)
    question = result.scalar_one_or_none()

    return {
        "attempt_id": str(attempt.id),
        "question": _format_question(question) if question else None,
    }


@router.post("/submit/{attempt_id}")
async def submit_answer(
    attempt_id: str,
    data: SubmitAnswerRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Submit an answer for a question in an assessment."""
    # Get the question
    stmt = select(Question).where(Question.id == data.question_id)
    result = await db.execute(stmt)
    question = result.scalar_one_or_none()

    if not question:
        from app.core.errors import NotFoundError
        raise NotFoundError("Question", data.question_id)

    is_correct = data.answer == question.correct_answer

    # Update mastery for the skills tested
    if question.skill_ids:
        mastery_service = MasteryService(db)
        for skill_id in question.skill_ids:
            await mastery_service.record_evidence(
                learner_id=current_user.id,
                skill_id=skill_id,
                tenant_id=current_user.tenant_id,
                evidence_type="assessment",
                source_id=question.id,
                score=1.0 if is_correct else 0.0,
            )

    return {
        "is_correct": is_correct,
        "explanation": question.explanation if not is_correct else None,
        "correct_answer": question.correct_answer if not is_correct else None,
    }


def _format_question(question: Question) -> dict:
    return {
        "id": str(question.id),
        "content": question.content,
        "question_type": question.question_type,
        "difficulty_level": question.difficulty_level,
        "estimated_time_seconds": question.estimated_time_seconds,
        "options": question.options,
        "hints": question.hints,
    }
