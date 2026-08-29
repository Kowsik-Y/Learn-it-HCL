"""
Recommendation Engine — The Heart of the Platform

Implements the 11-stage recommendation pipeline:
1. Learner State Builder
2. Goal Interpreter
3. Skill Gap Analyzer
4. Candidate Generator
5. Prerequisite Filter
6. Mastery Filter
7. Personalization Ranker
8. Diversity Re-Ranker
9. Path Constraint Solver
10. Explanation Generator
11. Feedback Recorder

Every recommendation has machine-readable evidence and human-friendly explanations.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.mastery.models import MasteryState
from app.modules.mastery.models import MasteryState
from app.generated_models import (
    Skills as Skill,
    SkillRelationships as SkillRelationship,
    RoleSkills as RoleSkill,
    Lessons as Lesson,
    Courses as Course,
    LearnerGoals as LearnerGoal,
    LearnerPreferences as LearnerPreferences
)


@dataclass
class RecommendationCandidate:
    """A candidate learning resource for recommendation."""
    resource_id: uuid.UUID
    resource_type: str
    title: str
    skill_ids: list[str]
    difficulty_level: str
    estimated_duration_minutes: int
    score: float = 0.0
    reasons: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class SkillGap:
    """A gap between current mastery and required mastery."""
    skill_id: uuid.UUID
    skill_name: str
    current_mastery: float
    required_mastery: float
    gap: float
    priority: str
    prerequisites_met: bool


@dataclass
class RecommendationResult:
    """Final recommendation with full explainability."""
    resource_id: str
    resource_type: str
    title: str
    score: float
    rank: int
    confidence: str
    reasons: list[str]
    fills_skills: list[str]
    estimated_duration_minutes: int


class RecommendationEngine:
    """
    11-stage recommendation pipeline.

    Uses deterministic scoring with configurable weights.
    LLMs are NOT used for recommendation ranking —
    they are used only for explanation generation.
    """

    # Configurable weights for the scoring formula
    WEIGHTS = {
        "goal_match": 0.20,
        "skill_gap_match": 0.20,
        "prerequisite_fit": 0.15,
        "mastery_fit": 0.10,
        "preference_fit": 0.10,
        "difficulty_fit": 0.08,
        "time_fit": 0.07,
        "content_quality": 0.05,
        "novelty": 0.03,
        "redundancy_penalty": -0.02,
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_recommendations(
        self,
        learner_id: uuid.UUID,
        tenant_id: uuid.UUID,
        max_results: int = 10,
        available_minutes: int | None = None,
    ) -> list[RecommendationResult]:
        """Run the full 11-stage pipeline."""

        # Stage 1: Build learner state
        learner_state = await self._build_learner_state(learner_id, tenant_id)

        # Stage 2: Interpret goals
        goal_skills = await self._interpret_goals(learner_state, tenant_id)

        # Stage 3: Analyze skill gaps
        skill_gaps = await self._analyze_skill_gaps(
            learner_state["mastery"], goal_skills, tenant_id
        )

        # Stage 4: Generate candidates
        candidates = await self._generate_candidates(
            skill_gaps, tenant_id, available_minutes
        )

        # Stage 5: Filter by prerequisites
        candidates = await self._filter_prerequisites(
            candidates, learner_state["mastery"], tenant_id
        )

        # Stage 6: Filter by mastery (remove redundant)
        candidates = self._filter_mastery(candidates, learner_state["mastery"])

        # Stage 7: Score and rank (personalization)
        candidates = self._rank_candidates(
            candidates, learner_state, skill_gaps, available_minutes
        )

        # Stage 8: Diversity re-ranking
        candidates = self._diversity_rerank(candidates)

        # Stage 9: Path constraint solving
        candidates = self._apply_path_constraints(
            candidates, available_minutes, max_results
        )

        # Stage 10: Generate explanations
        results = self._generate_explanations(candidates, skill_gaps, learner_state)

        return results[:max_results]

    # ── Stage 1: Learner State Builder ────────────────────────

    async def _build_learner_state(
        self, learner_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> dict[str, Any]:
        """Aggregate mastery, preferences, goals, and history."""
        # Get mastery states
        mastery_stmt = select(MasteryState).where(
            MasteryState.learner_id == learner_id,
            MasteryState.tenant_id == tenant_id,
        )
        mastery_result = await self.db.execute(mastery_stmt)
        mastery_states = {
            str(m.skill_id): m for m in mastery_result.scalars().all()
        }

        # Get preferences
        from app.generated_models import LearnerProfiles as LearnerProfile
        pref_stmt = select(LearnerPreferences).join(
            LearnerProfile, LearnerPreferences.learner_id == LearnerProfile.id
        ).where(LearnerProfile.user_id == learner_id)
        pref_result = await self.db.execute(pref_stmt)
        preferences = pref_result.scalar_one_or_none()

        # Get active goals
        goal_stmt = select(LearnerGoal).join(
            LearnerProfile, LearnerGoal.learner_id == LearnerProfile.id
        ).where(
            LearnerProfile.user_id == learner_id,
            LearnerGoal.is_active == True,
        )
        goal_result = await self.db.execute(goal_stmt)
        goals = list(goal_result.scalars().all())

        return {
            "learner_id": learner_id,
            "mastery": mastery_states,
            "preferences": preferences,
            "goals": goals,
        }

    # ── Stage 2: Goal Interpreter ─────────────────────────────

    async def _interpret_goals(
        self, learner_state: dict, tenant_id: uuid.UUID
    ) -> list[dict[str, Any]]:
        """Map goals to required skill sets."""
        goal_skills = []
        for goal in learner_state.get("goals", []):
            if goal.target_role_id:
                # Get skills for career role
                stmt = (
                    select(RoleSkill, Skill)
                    .join(Skill, RoleSkill.skill_id == Skill.id)
                    .where(RoleSkill.career_role_id == goal.target_role_id)
                )
                result = await self.db.execute(stmt)
                for rs, skill in result.all():
                    goal_skills.append({
                        "skill_id": skill.id,
                        "skill_name": skill.name,
                        "importance": rs.importance,
                        "minimum_mastery": rs.minimum_mastery,
                    })
        return goal_skills

    # ── Stage 3: Skill Gap Analyzer ───────────────────────────

    async def _analyze_skill_gaps(
        self,
        mastery: dict[str, MasteryState],
        goal_skills: list[dict],
        tenant_id: uuid.UUID,
    ) -> list[SkillGap]:
        """Compute gaps between current mastery and requirements."""
        gaps = []
        for gs in goal_skills:
            skill_id = str(gs["skill_id"])
            current = mastery.get(skill_id)
            current_score = current.mastery_score if current else 0.0
            required = gs["minimum_mastery"]
            gap = max(0, required - current_score)

            if gap > 0:
                # Check prerequisites
                prereqs_met = await self._check_prerequisites_met(
                    gs["skill_id"], mastery, tenant_id
                )
                priority = "critical" if gap > 0.5 else "high" if gap > 0.3 else "medium"

                gaps.append(SkillGap(
                    skill_id=gs["skill_id"],
                    skill_name=gs["skill_name"],
                    current_mastery=current_score,
                    required_mastery=required,
                    gap=gap,
                    priority=priority,
                    prerequisites_met=prereqs_met,
                ))

        # Sort by priority then gap size
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        gaps.sort(key=lambda g: (priority_order.get(g.priority, 3), -g.gap))
        return gaps

    async def _check_prerequisites_met(
        self,
        skill_id: uuid.UUID,
        mastery: dict[str, MasteryState],
        tenant_id: uuid.UUID,
    ) -> bool:
        """Check if all prerequisites for a skill are mastered."""
        stmt = select(SkillRelationship).where(
            SkillRelationship.target_skill_id == skill_id,
            SkillRelationship.relationship_type == "prerequisite",
            SkillRelationship.tenant_id == tenant_id,
        )
        result = await self.db.execute(stmt)
        prerequisites = result.scalars().all()

        for prereq in prerequisites:
            prereq_mastery = mastery.get(str(prereq.source_skill_id))
            if not prereq_mastery or prereq_mastery.mastery_score < 0.6:
                return False
        return True

    # ── Stage 4: Candidate Generator ─────────────────────────

    async def _generate_candidates(
        self,
        skill_gaps: list[SkillGap],
        tenant_id: uuid.UUID,
        available_minutes: int | None = None,
    ) -> list[RecommendationCandidate]:
        """Find matching content for identified skill gaps."""
        candidates = []
        gap_skill_ids = [str(g.skill_id) for g in skill_gaps]

        # Query lessons that teach gap skills
        stmt = select(Lesson).where(
            Lesson.tenant_id == tenant_id,
        )
        if available_minutes:
            stmt = stmt.where(Lesson.estimated_duration_minutes <= available_minutes)

        result = await self.db.execute(stmt)
        lessons = result.scalars().all()

        for lesson in lessons:
            lesson_skills = lesson.skill_ids or []
            # Check if this lesson addresses any skill gap
            matching = [s for s in lesson_skills if s in gap_skill_ids]
            if matching:
                candidates.append(RecommendationCandidate(
                    resource_id=lesson.id,
                    resource_type="lesson",
                    title=lesson.title,
                    skill_ids=lesson_skills,
                    difficulty_level=lesson.difficulty_level,
                    estimated_duration_minutes=lesson.estimated_duration_minutes,
                ))

        return candidates

    # ── Stage 5: Prerequisite Filter ─────────────────────────

    async def _filter_prerequisites(
        self,
        candidates: list[RecommendationCandidate],
        mastery: dict[str, MasteryState],
        tenant_id: uuid.UUID,
    ) -> list[RecommendationCandidate]:
        """Remove candidates with unmet prerequisites."""
        filtered = []
        for candidate in candidates:
            has_prereqs = True
            for skill_id in candidate.skill_ids:
                if not await self._check_prerequisites_met(
                    uuid.UUID(skill_id) if isinstance(skill_id, str) else skill_id,
                    mastery, tenant_id
                ):
                    has_prereqs = False
                    break

            if has_prereqs:
                candidate.reasons.append({
                    "type": "prerequisites_met",
                    "description": "All prerequisites are mastered",
                })
                filtered.append(candidate)

        return filtered

    # ── Stage 6: Mastery Filter ───────────────────────────────

    def _filter_mastery(
        self,
        candidates: list[RecommendationCandidate],
        mastery: dict[str, MasteryState],
    ) -> list[RecommendationCandidate]:
        """Remove redundant content for already-mastered skills."""
        filtered = []
        for candidate in candidates:
            all_mastered = all(
                mastery.get(str(sid), None) is not None
                and mastery[str(sid)].mastery_score >= 0.85
                for sid in candidate.skill_ids
            )
            if not all_mastered:
                filtered.append(candidate)
        return filtered

    # ── Stage 7: Personalization Ranker ───────────────────────

    def _rank_candidates(
        self,
        candidates: list[RecommendationCandidate],
        learner_state: dict,
        skill_gaps: list[SkillGap],
        available_minutes: int | None,
    ) -> list[RecommendationCandidate]:
        """Score candidates using the weighted recommendation formula."""
        gap_map = {str(g.skill_id): g for g in skill_gaps}
        preferences = learner_state.get("preferences")

        for candidate in candidates:
            score = 0.0

            # Goal match: how many gap skills does this address?
            matching_gaps = [
                gap_map[sid] for sid in candidate.skill_ids if sid in gap_map
            ]
            if matching_gaps:
                goal_score = len(matching_gaps) / max(len(gap_map), 1)
                score += goal_score * self.WEIGHTS["goal_match"]
                candidate.reasons.append({
                    "type": "fills_skill_gap",
                    "description": f"Fills gap: {', '.join(g.skill_name for g in matching_gaps)}",
                })

            # Skill gap match: average gap size for matching skills
            if matching_gaps:
                avg_gap = sum(g.gap for g in matching_gaps) / len(matching_gaps)
                score += avg_gap * self.WEIGHTS["skill_gap_match"]

            # Difficulty fit
            diff_map = {"beginner": 0.2, "intermediate": 0.5, "advanced": 0.8}
            candidate_diff = diff_map.get(candidate.difficulty_level, 0.5)
            if preferences and preferences.preferred_difficulty != "adaptive":
                pref_diff = diff_map.get(preferences.preferred_difficulty, 0.5)
                diff_fit = 1.0 - abs(candidate_diff - pref_diff)
                score += diff_fit * self.WEIGHTS["difficulty_fit"]

            # Time fit
            if available_minutes and candidate.estimated_duration_minutes <= available_minutes:
                time_fit = 1.0 - (candidate.estimated_duration_minutes / available_minutes) * 0.3
                score += time_fit * self.WEIGHTS["time_fit"]
                candidate.reasons.append({
                    "type": "fits_time",
                    "description": f"Fits your {available_minutes}-minute window",
                })

            # Preference fit
            if preferences:
                if preferences.preferred_content_type == "video" and candidate.resource_type == "lesson":
                    score += 0.5 * self.WEIGHTS["preference_fit"]
                if preferences.project_oriented and candidate.resource_type == "project":
                    score += 1.0 * self.WEIGHTS["preference_fit"]

            candidate.score = max(0.0, min(1.0, score))

        candidates.sort(key=lambda c: c.score, reverse=True)
        return candidates

    # ── Stage 8: Diversity Re-Ranker ──────────────────────────

    def _diversity_rerank(
        self, candidates: list[RecommendationCandidate]
    ) -> list[RecommendationCandidate]:
        """Ensure variety — avoid recommending 5 nearly identical resources."""
        if len(candidates) <= 3:
            return candidates

        reranked = [candidates[0]]
        seen_skills = set(candidates[0].skill_ids)

        for candidate in candidates[1:]:
            overlap = len(set(candidate.skill_ids) & seen_skills) / max(len(candidate.skill_ids), 1)
            if overlap < 0.8:  # Less than 80% skill overlap
                reranked.append(candidate)
                seen_skills.update(candidate.skill_ids)
            else:
                # Penalize score for redundancy but still include
                candidate.score *= 0.7
                reranked.append(candidate)

        return reranked

    # ── Stage 9: Path Constraint Solver ───────────────────────

    def _apply_path_constraints(
        self,
        candidates: list[RecommendationCandidate],
        available_minutes: int | None,
        max_results: int,
    ) -> list[RecommendationCandidate]:
        """Apply time and count constraints."""
        if available_minutes:
            total_time = 0
            constrained = []
            for c in candidates:
                if total_time + c.estimated_duration_minutes <= available_minutes * 1.5:
                    constrained.append(c)
                    total_time += c.estimated_duration_minutes
            return constrained[:max_results]
        return candidates[:max_results]

    # ── Stage 10: Explanation Generator ───────────────────────

    def _generate_explanations(
        self,
        candidates: list[RecommendationCandidate],
        skill_gaps: list[SkillGap],
        learner_state: dict,
    ) -> list[RecommendationResult]:
        """Create human-friendly recommendation explanations."""
        results = []
        for rank, candidate in enumerate(candidates, 1):
            reasons = [r["description"] for r in candidate.reasons]
            fills_skills = [
                s for s in candidate.skill_ids
            ]

            confidence = "high" if candidate.score > 0.7 else "medium" if candidate.score > 0.4 else "low"

            results.append(RecommendationResult(
                resource_id=str(candidate.resource_id),
                resource_type=candidate.resource_type,
                title=candidate.title,
                score=round(candidate.score, 3),
                rank=rank,
                confidence=confidence,
                reasons=reasons,
                fills_skills=fills_skills,
                estimated_duration_minutes=candidate.estimated_duration_minutes,
            ))

        return results
