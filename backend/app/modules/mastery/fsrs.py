"""
Free Spaced Repetition Scheduler (FSRS v4) — Learn-it HCL ML Microservice

Advanced Machine Learning Spaced Repetition Scheduler (outperforming SM-2 / Leitner).
Tracks Difficulty (D), Stability (S), and calculates Retrievability (R) over time.

Rating scale:
1: Again (Forgotten)
2: Hard (Recalled with major effort)
3: Good (Recalled successfully)
4: Easy (Recalled effortlessly)
"""

import math
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Tuple


@dataclass
class FSRSCardState:
    difficulty: float = 5.0      # Scale [1.0 - 10.0]
    stability: float = 1.0       # Memory stability in days
    reps: int = 0                # Total successful reviews
    lapses: int = 0              # Times forgotten (Rating = 1)
    last_review: datetime = None
    next_review: datetime = None


@dataclass
class FSRSReviewOutput:
    new_difficulty: float
    new_stability: float
    retrievability: float       # Predicted probability of recall right now
    next_interval_days: float   # Recommended days until next review
    next_review_date: datetime


class FSRSModel:
    """FSRS v4 Spaced Repetition Engine."""

    # Weights trained for optimal retention optimization
    W = [
        0.4, 0.6, 2.4, 5.8,      # Initial stabilities for ratings 1..4
        4.93, 0.94, 0.86, 0.01,  # Difficulty dynamics
        1.49, 0.14, 0.94,        # Recall stability dynamics
        2.18, 0.05, 0.34, 1.26,  # Forget stability dynamics
        0.29, 2.61,              # Hard penalty & Easy bonus
    ]

    def __init__(self, desired_retention: float = 0.90):
        self.desired_retention = max(0.70, min(0.98, desired_retention))

    def retrievability(self, elapsed_days: float, stability: float) -> float:
        """
        Calculate memory retrievability (decay curve).
        R(t, S) = (1 + t / (9 * S))^(-1)
        """
        if stability <= 0:
            return 0.0
        return (1.0 + elapsed_days / (9.0 * stability)) ** (-1.0)

    def next_interval(self, stability: float) -> float:
        """
        Calculate optimal review interval (in days) to achieve desired retention.
        Interval I = 9 * S * (R_desired^(-1) - 1)
        """
        if stability <= 0:
            return 1.0
        interval = 9.0 * stability * ((1.0 / self.desired_retention) - 1.0)
        return max(1.0, round(interval, 2))

    def _init_stability(self, rating: int) -> float:
        """Initial stability for first review based on rating (1..4)."""
        idx = max(1, min(4, rating)) - 1
        return self.W[idx]

    def _next_difficulty(self, current_d: float, rating: int) -> float:
        """Update difficulty parameter based on response rating."""
        # Standard rating center = 3 (Good)
        d_change = -self.W[6] * (rating - 3)
        # Mean reversion towards default difficulty
        new_d = current_d + d_change
        new_d = self.W[7] * 5.0 + (1 - self.W[7]) * new_d
        return max(1.0, min(10.0, new_d))

    def review(
        self,
        card: FSRSCardState,
        rating: int,
        review_time: datetime = None,
    ) -> FSRSReviewOutput:
        """
        Process a review attempt for a skill or question item.
        
        Args:
            card: Current FSRS state of the skill/card
            rating: Rating given (1=Again, 2=Hard, 3=Good, 4=Easy)
            review_time: Timestamp of review (defaults to UTC now)
            
        Returns:
            FSRSReviewOutput with updated parameters and scheduling.
        """
        now = review_time or datetime.now(timezone.utc)
        rating = max(1, min(4, rating))

        if card.last_review is None:
            elapsed_days = 0.0
            r_current = 1.0
        else:
            elapsed_days = max(0.0, (now - card.last_review).total_seconds() / 86400.0)
            r_current = self.retrievability(elapsed_days, card.stability)

        # Update difficulty
        new_d = self._next_difficulty(card.difficulty, rating)

        # Update stability
        if card.reps == 0 or card.last_review is None:
            new_s = self._init_stability(rating)
        else:
            if rating == 1:
                # Forget (Lapse): Stability drops
                new_s = (
                    self.W[11]
                    * (new_d ** -self.W[12])
                    * ((card.stability + 1.0) ** self.W[13])
                    * math.exp(self.W[14] * (1.0 - r_current))
                )
            else:
                # Recall: Stability increases
                hard_penalty = self.W[15] if rating == 2 else 1.0
                easy_bonus = self.W[16] if rating == 4 else 1.0

                inc = (
                    math.exp(self.W[8])
                    * (11.0 - new_d)
                    * (card.stability ** -self.W[9])
                    * (math.exp(self.W[10] * (1.0 - r_current)) - 1.0)
                    * hard_penalty
                    * easy_bonus
                )
                new_s = card.stability * (1.0 + max(0.01, inc))

        new_s = max(0.1, min(3650.0, new_s))
        interval_days = self.next_interval(new_s)
        next_review_date = now + timedelta(days=interval_days)

        return FSRSReviewOutput(
            new_difficulty=round(new_d, 3),
            new_stability=round(new_s, 3),
            retrievability=round(r_current, 3),
            next_interval_days=interval_days,
            next_review_date=next_review_date,
        )

    def save(self, filepath: str = "saved_models/fsrs_model.joblib") -> str:
        """Save trained FSRS model to disk using joblib or pickle."""
        from app.modules.common.model_persistence import save_ml_model
        return save_ml_model(self, filepath)

    @classmethod
    def load(cls, filepath: str = "saved_models/fsrs_model.joblib") -> "FSRSModel":
        """Load trained FSRS model from disk using joblib or pickle."""
        from app.modules.common.model_persistence import load_ml_model
        return load_ml_model(filepath)

