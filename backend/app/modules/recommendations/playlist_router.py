"""
Adaptive Playlist Router — Learn-it HCL ML Microservice

Endpoints:
  GET  /api/ml/playlist/{topic}        → Get ranked video for learner context
  POST /api/ml/playlist/event          → Record video watch event → updates BKT
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.modules.recommendations.playlist_engine import PlaylistEngine, LearnerMLContext
from app.modules.mastery.bkt import BKTModel, BKTParams

router = APIRouter()
_engine = PlaylistEngine()
_bkt = BKTModel()


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────────────────────────

class PlaylistRequest(BaseModel):
    topic: str
    mastery_prob: float = Field(default=0.10, ge=0.0, le=1.0)
    retention_score: float = Field(default=1.0, ge=0.0, le=1.0)
    ability_theta: float = Field(default=0.0, ge=-4.0, le=4.0)
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
    evidence_count: int = Field(default=0, ge=0)


class VideoEventRequest(BaseModel):
    """Engagement event reported from the frontend adaptive video player."""
    skill_id: str
    video_id: str
    current_mastery: float = Field(ge=0.0, le=1.0)
    watch_percentage: float = Field(ge=0.0, le=100.0)  # 0–100%
    quiz_correct: bool | None = None  # None if no quiz taken after video


class VideoEventResponse(BaseModel):
    updated_mastery: float
    bkt_update_applied: bool
    evidence_weight: float
    message: str


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/playlist/select")
async def select_video(req: PlaylistRequest):
    """
    Select the optimal YouTube video for a learner based on ML signals.
    All selection decisions are fully explainable.
    """
    ctx = LearnerMLContext(
        mastery_prob=req.mastery_prob,
        retention_score=req.retention_score,
        ability_theta=req.ability_theta,
        risk_score=req.risk_score,
        evidence_count=req.evidence_count,
    )

    selection = _engine.get_playlist(topic=req.topic, ctx=ctx)

    return {
        "primary_video": {
            "video_id": selection.primary_video.video_id,
            "title": selection.primary_video.title,
            "channel": selection.primary_video.channel,
            "duration_mins": selection.primary_video.duration_mins,
            "embed_url": selection.primary_video.embed_url,
            "watch_url": selection.primary_video.watch_url,
            "tier": selection.primary_video.tier,
        },
        "fallback_video": {
            "video_id": selection.fallback_video.video_id,
            "title": selection.fallback_video.title,
            "embed_url": selection.fallback_video.embed_url,
            "tier": selection.fallback_video.tier,
        } if selection.fallback_video else None,
        "tier_selected": selection.tier_selected,
        "reason": selection.reason,
        "ml_signals": selection.ml_signals,
    }


@router.post("/playlist/event", response_model=VideoEventResponse)
async def record_video_event(req: VideoEventRequest):
    """
    Process a video watch engagement event from the frontend.
    Updates BKT mastery if sufficient engagement (watch% ≥ 80%) or quiz result available.
    """
    # Determine if this watch event constitutes a learning signal
    # Weight: full watch (>=80%) counts as 0.6 evidence weight; quiz adds 1.0
    bkt_applied = False
    updated_mastery = req.current_mastery
    evidence_weight = 0.0
    msg_parts = []

    if req.quiz_correct is not None:
        # Quiz result is the strongest signal — full BKT weight
        result = _bkt.update(
            current_mastery=req.current_mastery,
            is_correct=req.quiz_correct,
            item_weight=1.0,
        )
        updated_mastery = result.mastery_prob
        evidence_weight = 1.0
        bkt_applied = True
        outcome = "correct" if req.quiz_correct else "incorrect"
        msg_parts.append(f"Post-video quiz was {outcome} — BKT updated to {updated_mastery:.1%}.")

    elif req.watch_percentage >= 80.0:
        # High watch completion — treat as a weak positive signal (no quiz confirmation)
        result = _bkt.update(
            current_mastery=req.current_mastery,
            is_correct=True,
            item_weight=0.6,  # Lighter weight: passive watching vs. active recall
        )
        updated_mastery = result.mastery_prob
        evidence_weight = 0.6
        bkt_applied = True
        msg_parts.append(
            f"Watched {req.watch_percentage:.0f}% of video — weak positive BKT signal applied."
        )

    elif req.watch_percentage < 20.0:
        # Very low engagement — possible disengagement signal (no mastery update)
        msg_parts.append(
            f"Low watch engagement ({req.watch_percentage:.0f}%) — no mastery update applied. "
            f"Consider offering a shorter video or checking dropout risk."
        )
    else:
        msg_parts.append(
            f"Partial watch ({req.watch_percentage:.0f}%) — below threshold for BKT update."
        )

    return VideoEventResponse(
        updated_mastery=round(updated_mastery, 4),
        bkt_update_applied=bkt_applied,
        evidence_weight=evidence_weight,
        message=" ".join(msg_parts),
    )
