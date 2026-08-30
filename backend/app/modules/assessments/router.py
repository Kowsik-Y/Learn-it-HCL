"""
Assessments Router — CAT-driven adaptive assessment ML endpoints.

Exposes IRT ability estimation and CAT question selection
to the Next.js API gateway for adaptive quiz flow.
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.modules.assessments.irt import IRTModel, IRTItem
from app.modules.assessments.cat_engine import CATEngine

router = APIRouter()

# Shared IRT model instance
_irt_model = IRTModel()
_cat_engine = CATEngine(irt_model=_irt_model)


class ResponseItem(BaseModel):
    """A single learner response to a question."""
    item_id: str
    difficulty: float = 0.0
    discrimination: float = 1.0
    is_correct: bool


class NextQuestionRequest(BaseModel):
    """Request for the next optimal adaptive question."""
    responses: list[ResponseItem] = []
    item_pool: list[dict] = []  # Available questions with IRT params
    current_theta: float = 0.0


class EstimateAbilityRequest(BaseModel):
    """Request to estimate learner ability from responses."""
    responses: list[ResponseItem]
    initial_theta: float = 0.0


@router.post("/adaptive/next-question")
async def adaptive_next_question(data: NextQuestionRequest, request: Request):
    """
    Select the next optimal question using CAT (Maximum Fisher Information).

    Called by Next.js API gateway during adaptive quiz flow.
    Returns the best next question and current ability estimate.
    """
    # Convert responses to IRT format
    administered = [
        (IRTItem(item_id=r.item_id, difficulty=r.difficulty, discrimination=r.discrimination), r.is_correct)
        for r in data.responses
    ]

    # Convert item pool to IRT items
    pool = [
        IRTItem(
            item_id=item.get("item_id", ""),
            difficulty=item.get("difficulty", 0.0),
            discrimination=item.get("discrimination", 1.0),
        )
        for item in data.item_pool
    ]

    # Run CAT selection
    result = _cat_engine.select_next_question(
        item_pool=pool,
        administered_history=administered,
        current_theta=data.current_theta,
    )

    return {
        "next_item": {
            "item_id": result.next_item.item_id,
            "difficulty": result.next_item.difficulty,
            "discrimination": result.next_item.discrimination,
        } if result.next_item else None,
        "current_ability": {
            "theta": result.current_ability.theta,
            "standard_error": result.current_ability.standard_error,
            "total_items": result.current_ability.total_items,
        },
        "is_complete": result.is_complete,
        "reason": result.reason,
    }


@router.post("/adaptive/estimate-ability")
async def estimate_ability(data: EstimateAbilityRequest, request: Request):
    """
    Estimate learner ability (theta) from quiz responses using 2PL IRT MLE.

    Returns final ability estimate with standard error for diagnostic scoring.
    """
    responses = [
        (IRTItem(item_id=r.item_id, difficulty=r.difficulty, discrimination=r.discrimination), r.is_correct)
        for r in data.responses
    ]

    ability = _irt_model.estimate_ability(responses, initial_theta=data.initial_theta)

    # Compute per-item analysis
    item_analysis = []
    for r in data.responses:
        item = IRTItem(item_id=r.item_id, difficulty=r.difficulty, discrimination=r.discrimination)
        p_correct = _irt_model.probability(ability.theta, item.discrimination, item.difficulty)
        fisher_info = _irt_model.fisher_information(ability.theta, item.discrimination, item.difficulty)
        item_analysis.append({
            "item_id": r.item_id,
            "is_correct": r.is_correct,
            "predicted_probability": round(p_correct, 3),
            "fisher_information": round(fisher_info, 3),
            "difficulty": r.difficulty,
        })

    # Classify ability level
    theta = ability.theta
    if theta >= 1.5:
        level = "advanced"
    elif theta >= 0.0:
        level = "intermediate"
    elif theta >= -1.0:
        level = "beginner"
    else:
        level = "novice"

    return {
        "ability": {
            "theta": ability.theta,
            "standard_error": ability.standard_error,
            "total_items": ability.total_items,
            "level": level,
        },
        "item_analysis": item_analysis,
    }
