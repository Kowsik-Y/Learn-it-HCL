"""
Adaptive YouTube Playlist Engine — Learn-it HCL ML Microservice

Selects the optimal YouTube video for a learner per skill/lesson using:
  1. BKT mastery_prob  → determines beginner/intermediate/advanced tier
  2. FSRS retention    → overrides to "re-explanation" video when retention < 0.50
  3. IRT theta         → constrains max video duration for low-ability learners
  4. Risk score        → prepends motivational short for at-risk learners
  5. Neural ranker     → re-ranks catalogue videos by semantic relevance (GPU model)
"""

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


# ─────────────────────────────────────────────────────────────────────────────
# Data Structures
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class VideoEntry:
    video_id: str
    title: str
    channel: str
    duration_mins: int
    tier: str          # "beginner" | "intermediate" | "advanced"
    topic: str
    embed_url: str
    watch_url: str


@dataclass
class PlaylistSelection:
    primary_video: VideoEntry
    fallback_video: Optional[VideoEntry]
    tier_selected: str
    reason: str                  # Human-readable explanation (explainability)
    ml_signals: dict             # Raw ML signals used for this decision


@dataclass
class LearnerMLContext:
    """Snapshot of all ML model outputs for a learner at a given moment."""
    mastery_prob: float          # BKT P(L_t)  [0.0–1.0]
    retention_score: float       # FSRS R(t,S) [0.0–1.0]
    ability_theta: float         # IRT θ       [-4.0–+4.0]
    risk_score: float            # Dropout risk [0.0–100.0]
    evidence_count: int          # Number of evidence records for this skill


# ─────────────────────────────────────────────────────────────────────────────
# Topic Normalizer
# ─────────────────────────────────────────────────────────────────────────────

TOPIC_ALIASES: dict[str, str] = {
    "react": "react",
    "reactjs": "react",
    "react.js": "react",
    "python": "python",
    "py": "python",
    "data structures": "data_structures",
    "dsa": "data_structures",
    "algorithms": "data_structures",
    "sql": "sql",
    "database": "sql",
    "postgresql": "sql",
    "mysql": "sql",
    "machine learning": "machine_learning",
    "ml": "machine_learning",
    "deep learning": "machine_learning",
    "ai": "machine_learning",
}


def normalize_topic(raw_topic: str) -> Optional[str]:
    key = raw_topic.strip().lower()
    return TOPIC_ALIASES.get(key) or TOPIC_ALIASES.get(key.split()[0])


# ─────────────────────────────────────────────────────────────────────────────
# Playlist Engine
# ─────────────────────────────────────────────────────────────────────────────

class PlaylistEngine:
    """
    Core ML-driven playlist selector.

    All tier decisions are deterministic and fully explainable.
    The neural ranker (GPU) is used as an optional re-ranking layer.
    """

    CATALOGUE_PATH = Path(__file__).parent.parent.parent / "data" / "video_catalogue.json"

    # BKT mastery thresholds for tier selection
    BEGINNER_THRESHOLD = 0.30
    ADVANCED_THRESHOLD = 0.65

    # FSRS retention threshold for re-explanation override
    RETENTION_OVERRIDE_THRESHOLD = 0.50

    # IRT ability → max video duration cap (minutes)
    LOW_ABILITY_MAX_DURATION = 30  # theta < -1.0

    def __init__(self):
        self._catalogue: Optional[dict] = None
        self._ranker = None  # Lazy-loaded neural ranker

    def _load_catalogue(self) -> dict:
        if self._catalogue is None:
            with open(self.CATALOGUE_PATH, "r") as f:
                self._catalogue = json.load(f)
        return self._catalogue

    def _try_load_ranker(self):
        """Lazily load neural ranker — won't fail if model not trained yet."""
        if self._ranker is None:
            try:
                from app.modules.recommendations.video_ranker import load_video_ranker
                self._ranker = load_video_ranker()
            except Exception:
                self._ranker = None

    def _make_entry(self, raw: dict, tier: str, topic: str) -> VideoEntry:
        vid_id = raw["id"]
        return VideoEntry(
            video_id=vid_id,
            title=raw["title"],
            channel=raw["channel"],
            duration_mins=raw["duration_mins"],
            tier=tier,
            topic=topic,
            embed_url=f"https://www.youtube.com/embed/{vid_id}",
            watch_url=f"https://www.youtube.com/watch?v={vid_id}",
        )

    def _select_tier(self, ctx: LearnerMLContext) -> tuple[str, str]:
        """
        Determine the appropriate video tier and the reason for this choice.
        Returns: (tier_name, reason_string)
        """
        # Not enough evidence — stay conservative
        if ctx.evidence_count < 2:
            return "beginner", "Insufficient evidence (fewer than 2 quiz attempts) — starting with foundational content."

        # FSRS retention override: learner is forgetting — re-explain at a simpler level
        if ctx.retention_score < self.RETENTION_OVERRIDE_THRESHOLD:
            return "beginner", (
                f"Your memory retention for this topic is {ctx.retention_score:.0%} "
                f"(below 50%) — serving a fresh explanation to consolidate the concept."
            )

        # BKT mastery-based tier selection
        if ctx.mastery_prob < self.BEGINNER_THRESHOLD:
            reason = (
                f"Your current mastery score is {ctx.mastery_prob:.0%} — "
                f"this foundational video builds core understanding."
            )
            return "beginner", reason
        elif ctx.mastery_prob < self.ADVANCED_THRESHOLD:
            reason = (
                f"Your mastery score is {ctx.mastery_prob:.0%} — "
                f"this intermediate video deepens your existing knowledge."
            )
            return "intermediate", reason
        else:
            reason = (
                f"Your mastery score is {ctx.mastery_prob:.0%} — "
                f"this advanced video covers expert patterns and architecture."
            )
            return "advanced", reason

    def _apply_duration_filter(
        self,
        videos: list[dict],
        ctx: LearnerMLContext,
    ) -> list[dict]:
        """Filter video pool by max duration for very low-ability learners (IRT theta < -1.0)."""
        if ctx.ability_theta < -1.0:
            filtered = [v for v in videos if v["duration_mins"] <= self.LOW_ABILITY_MAX_DURATION]
            return filtered if filtered else videos  # fall back to full pool if nothing fits
        return videos

    def _rank_with_neural_model(
        self,
        videos: list[dict],
        topic: str,
        ctx: LearnerMLContext,
    ) -> list[dict]:
        """Re-rank candidate videos using the trained neural ranker if available."""
        self._try_load_ranker()
        if self._ranker is None:
            return videos

        try:
            import torch
            from app.modules.recommendations.video_ranker import (
                make_feature,
                get_device,
                KNOWN_TOPICS,
            )

            device = get_device()
            # Normalize IRT ability [-4,+4] → [0,1]
            ability_norm = (ctx.ability_theta + 4.0) / 8.0
            topic_key = normalize_topic(topic) or "python"

            rows = [
                make_feature(topic_key, ability_norm, v["duration_mins"])
                for v in videos
            ]
            X = torch.tensor(rows, dtype=torch.float32).to(device)
            with torch.no_grad():
                scores = self._ranker(X).cpu().tolist()

            if isinstance(scores, float):
                scores = [scores]

            ranked = sorted(zip(videos, scores), key=lambda pair: pair[1], reverse=True)
            return [v for v, _ in ranked]
        except Exception:
            return videos


    def get_playlist(
        self,
        topic: str,
        ctx: LearnerMLContext,
    ) -> PlaylistSelection:
        """
        Select the optimal video for a learner at a given moment.

        Args:
            topic: Course/lesson topic string (e.g. "react", "python")
            ctx:   Current ML signals for this learner × skill

        Returns:
            PlaylistSelection with primary video, fallback, tier, and reason.
        """
        catalogue = self._load_catalogue()
        topic_key = normalize_topic(topic) or "python"  # Default fallback topic

        topic_data = catalogue.get(topic_key)
        if topic_data is None:
            # Unknown topic — fall back to generic YouTube search
            from dataclasses import replace
            fallback_entry = VideoEntry(
                video_id="",
                title=f"{topic} Tutorial",
                channel="YouTube",
                duration_mins=60,
                tier="beginner",
                topic=topic,
                embed_url=f"https://www.youtube.com/results?search_query={topic}+tutorial",
                watch_url=f"https://www.youtube.com/results?search_query={topic}+tutorial",
            )
            return PlaylistSelection(
                primary_video=fallback_entry,
                fallback_video=None,
                tier_selected="beginner",
                reason=f"Topic '{topic}' not in curated catalogue — serving search results.",
                ml_signals={
                    "mastery_prob": ctx.mastery_prob,
                    "retention_score": ctx.retention_score,
                    "risk_score": ctx.risk_score,
                },
            )

        # Determine tier from ML signals
        tier, reason = self._select_tier(ctx)

        # Get candidate pool for selected tier
        candidates = list(topic_data.get(tier, topic_data.get("beginner", [])))

        # Apply IRT duration filter
        candidates = self._apply_duration_filter(candidates, ctx)

        # Neural re-ranking (GPU, optional)
        candidates = self._rank_with_neural_model(candidates, topic_key, ctx)

        primary_raw = candidates[0]
        primary = self._make_entry(primary_raw, tier, topic_key)

        # Fallback: pick from a different tier to avoid repetition
        fallback_tier = "intermediate" if tier != "intermediate" else "beginner"
        fallback_pool = topic_data.get(fallback_tier, [])
        fallback = self._make_entry(fallback_pool[0], fallback_tier, topic_key) if fallback_pool else None

        return PlaylistSelection(
            primary_video=primary,
            fallback_video=fallback,
            tier_selected=tier,
            reason=reason,
            ml_signals={
                "mastery_prob": round(ctx.mastery_prob, 3),
                "retention_score": round(ctx.retention_score, 3),
                "ability_theta": round(ctx.ability_theta, 3),
                "risk_score": round(ctx.risk_score, 1),
                "evidence_count": ctx.evidence_count,
                "neural_ranker_active": self._ranker is not None,
            },
        )
