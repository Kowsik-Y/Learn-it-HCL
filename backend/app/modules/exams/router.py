"""Exams Module — Exam creation, scheduling, grading, and analytics."""

from fastapi import APIRouter
from app.modules.identity.dependencies import CurrentUser

router = APIRouter()

# Note: Exam management router is part of the assessments module
# This router handles exam-specific workflows like scheduling and proctoring
