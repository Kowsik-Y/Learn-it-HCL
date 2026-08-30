"""
Learner Attrition & Engagement Risk Predictor — Learn-it HCL ML Microservice

Evaluates learner behavioral signals (streak, recency, pass rate, retention)
to compute a Dropout & Engagement Risk Score (0-100%).
"""

import math
from dataclasses import dataclass
from typing import List, Dict, Any


@dataclass
class LearnerSignals:
    days_inactive: float           # Days since last completed activity
    current_streak: int            # Active daily streak
    pass_rate: float               # Assessment pass rate [0.0 - 1.0]
    avg_session_mins: float        # Average session length in minutes
    retention_score: float         # Average retention estimate [0.0 - 1.0]
    failed_attempts_streak: int    # Consecutive quiz failures


@dataclass
class RiskEvaluation:
    risk_score: float              # Risk score [0.0 - 100.0]
    risk_level: str                # 'low', 'moderate', 'high', 'critical'
    primary_risk_factors: List[str]
    suggested_nudge: str


class DropoutRiskPredictor:
    """ML Risk Scoring Engine for proactive learner retention."""

    # Model coefficients (trained logistic risk weights)
    B0 = -1.2                      # Base log-odds bias
    W_INACTIVE = 0.45              # Inactivity penalty per day
    W_STREAK = -0.35               # Streak protection credit per day
    W_PASS_RATE = -1.80            # Pass rate credit
    W_RETENTION = -1.50            # Retention credit
    W_FAIL_STREAK = 0.60           # Consecutive failure penalty

    def predict(self, signals: LearnerSignals) -> RiskEvaluation:
        """
        Compute learner dropout & engagement risk evaluation.
        
        Args:
            signals: Learner behavioral telemetry data.
            
        Returns:
            RiskEvaluation with score, classification, and recommended action.
        """
        # Calculate log-odds z
        z = (
            self.B0
            + self.W_INACTIVE * min(30.0, signals.days_inactive)
            + self.W_STREAK * min(14.0, float(signals.current_streak))
            + self.W_PASS_RATE * max(0.0, min(1.0, signals.pass_rate))
            + self.W_RETENTION * max(0.0, min(1.0, signals.retention_score))
            + self.W_FAIL_STREAK * min(5.0, float(signals.failed_attempts_streak))
        )

        # Sigmoid activation to get probability [0, 1]
        z_clamped = max(-10.0, min(10.0, z))
        prob = 1.0 / (1.0 + math.exp(-z_clamped))
        risk_score = round(prob * 100.0, 1)

        # Identify primary risk factors
        factors = []
        if signals.days_inactive >= 3.0:
            factors.append(f"Inactivity for {int(signals.days_inactive)} days")
        if signals.failed_attempts_streak >= 2:
            factors.append(f"{signals.failed_attempts_streak} consecutive quiz failures")
        if signals.pass_rate < 0.50:
            factors.append(f"Low quiz pass rate ({int(signals.pass_rate * 100)}%)")
        if signals.retention_score < 0.40:
            factors.append("Low memory retention score")
        if signals.current_streak == 0:
            factors.append("Broken daily streak")

        # Classify risk level & determine nudge strategy
        if risk_score >= 75.0:
            risk_level = "critical"
            nudge = "Send direct mentor intervention alert & offer simplified review mission"
        elif risk_score >= 50.0:
            risk_level = "high"
            nudge = "Send notification with 5-minute bite-sized quiz to recover streak"
        elif risk_score >= 25.0:
            risk_level = "moderate"
            nudge = "Recommend personalized review path & gamified XP boost"
        else:
            risk_level = "low"
            nudge = "Encourage progression to next milestone skill"

        return RiskEvaluation(
            risk_score=risk_score,
            risk_level=risk_level,
            primary_risk_factors=factors or ["Normal learning progression"],
            suggested_nudge=nudge,
        )

    def fit(self, training_data: List[tuple[LearnerSignals, bool]], lr: float = 0.05, epochs: int = 100):
        """
        Train risk predictor coefficients on historical student outcome data (churned vs active).
        
        Args:
            training_data: List of (LearnerSignals, is_churned) pairs.
            lr: Learning rate for SGD training.
            epochs: Training iterations.
        """
        if not training_data:
            return

        for _ in range(epochs):
            for signals, is_churned in training_data:
                target = 1.0 if is_churned else 0.0
                eval_res = self.predict(signals)
                pred_prob = eval_res.risk_score / 100.0
                err = pred_prob - target

                # Gradient descent step for logistic weights
                self.B0 -= lr * err
                self.W_INACTIVE -= lr * err * min(30.0, signals.days_inactive) / 30.0
                self.W_STREAK -= lr * err * min(14.0, float(signals.current_streak)) / 14.0
                self.W_PASS_RATE -= lr * err * signals.pass_rate
                self.W_RETENTION -= lr * err * signals.retention_score
                self.W_FAIL_STREAK -= lr * err * min(5.0, float(signals.failed_attempts_streak)) / 5.0

    def save(self, filepath: str = "saved_models/risk_predictor.joblib") -> str:
        """Save trained risk model to disk via joblib/pickle."""
        from app.modules.common.model_persistence import save_ml_model
        return save_ml_model(self, filepath)

    @classmethod
    def load(cls, filepath: str = "saved_models/risk_predictor.joblib") -> "DropoutRiskPredictor":
        """Load trained risk model from disk via joblib/pickle."""
        from app.modules.common.model_persistence import load_ml_model
        return load_ml_model(filepath)

