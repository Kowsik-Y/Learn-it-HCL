"""
Analytics Router — Dropout risk prediction and engagement analytics ML endpoints.

Exposes the dropout risk predictor to the Next.js API gateway
for teacher dashboards and learner nudging.
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.modules.analytics.risk_predictor import DropoutRiskPredictor

router = APIRouter()

# Shared predictor instance
_risk_predictor = DropoutRiskPredictor()


class LearnerSignals(BaseModel):
    """Input signals for dropout risk prediction."""
    days_inactive: int = 0
    current_streak: int = 0
    pass_rate: float = 0.7
    retention_score: float = 0.8
    consecutive_failures: int = 0


class SingleRiskRequest(BaseModel):
    """Request for single learner risk assessment."""
    learner_id: str
    signals: LearnerSignals


class BatchRiskRequest(BaseModel):
    """Request for batch risk assessment (teacher dashboard)."""
    learners: list[SingleRiskRequest]


@router.post("/dropout-risk")
async def predict_dropout_risk(data: SingleRiskRequest, request: Request):
    """
    Predict dropout risk for a single learner.

    Returns risk score (0-100%), risk level, and suggested nudge.
    Called by Next.js API gateway for learner engagement tracking.
    """
    prediction = _risk_predictor.predict(
        days_inactive=data.signals.days_inactive,
        current_streak=data.signals.current_streak,
        pass_rate=data.signals.pass_rate,
        retention_score=data.signals.retention_score,
        consecutive_failures=data.signals.consecutive_failures,
    )

    return {
        "learner_id": data.learner_id,
        "risk_score": prediction["risk_score"],
        "risk_level": prediction["risk_level"],
        "suggested_nudge": prediction["suggested_nudge"],
        "contributing_factors": _analyze_factors(data.signals),
    }


@router.post("/class-risk")
async def predict_class_risk(data: BatchRiskRequest, request: Request):
    """
    Batch dropout risk prediction for an entire class.

    Returns risk scores for all learners, sorted by risk (highest first).
    Used by teacher analytics dashboard for attrition radar.
    """
    results = []
    for learner in data.learners:
        prediction = _risk_predictor.predict(
            days_inactive=learner.signals.days_inactive,
            current_streak=learner.signals.current_streak,
            pass_rate=learner.signals.pass_rate,
            retention_score=learner.signals.retention_score,
            consecutive_failures=learner.signals.consecutive_failures,
        )
        results.append({
            "learner_id": learner.learner_id,
            "risk_score": prediction["risk_score"],
            "risk_level": prediction["risk_level"],
            "suggested_nudge": prediction["suggested_nudge"],
        })

    # Sort by risk score descending (highest risk first)
    results.sort(key=lambda r: r["risk_score"], reverse=True)

    # Compute class-level summary
    total = len(results)
    risk_counts = {"low": 0, "moderate": 0, "high": 0, "critical": 0}
    for r in results:
        level = r["risk_level"]
        if level in risk_counts:
            risk_counts[level] += 1

    return {
        "learners": results,
        "summary": {
            "total_learners": total,
            "at_risk_count": risk_counts["high"] + risk_counts["critical"],
            "critical_count": risk_counts["critical"],
            "high_count": risk_counts["high"],
            "moderate_count": risk_counts["moderate"],
            "low_count": risk_counts["low"],
            "average_risk": round(sum(r["risk_score"] for r in results) / max(total, 1), 1),
        },
    }


def _analyze_factors(signals: LearnerSignals) -> list[dict]:
    """Analyze which factors contribute most to risk."""
    factors = []

    if signals.days_inactive >= 5:
        factors.append({
            "factor": "inactivity",
            "severity": "high" if signals.days_inactive >= 10 else "medium",
            "description": f"Inactive for {signals.days_inactive} days",
        })

    if signals.current_streak == 0:
        factors.append({
            "factor": "no_streak",
            "severity": "medium",
            "description": "No active learning streak",
        })

    if signals.pass_rate < 0.5:
        factors.append({
            "factor": "low_pass_rate",
            "severity": "high" if signals.pass_rate < 0.3 else "medium",
            "description": f"Pass rate at {signals.pass_rate:.0%}",
        })

    if signals.retention_score < 0.5:
        factors.append({
            "factor": "low_retention",
            "severity": "high" if signals.retention_score < 0.3 else "medium",
            "description": f"Retention score at {signals.retention_score:.0%}",
        })

    if signals.consecutive_failures >= 3:
        factors.append({
            "factor": "failure_streak",
            "severity": "high" if signals.consecutive_failures >= 5 else "medium",
            "description": f"{signals.consecutive_failures} consecutive failures",
        })

    return factors
