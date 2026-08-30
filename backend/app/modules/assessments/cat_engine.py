"""
Computerized Adaptive Testing (CAT) Engine — Learn-it HCL ML Microservice

Selects optimal diagnostic assessment questions in real-time by maximizing
Fisher Information at the student's current estimated ability level theta.

Reduces required test items by 60-70% while maintaining diagnostic accuracy.
"""

from dataclasses import dataclass
from typing import List, Set, Optional

from app.modules.assessments.irt import IRTModel, IRTItem, AbilityEstimate


@dataclass
class CATSelectionResult:
    next_item: Optional[IRTItem]
    current_ability: AbilityEstimate
    is_complete: bool
    reason: str


class CATEngine:
    """Adaptive question selection engine for personalized assessments."""

    def __init__(
        self,
        irt_model: Optional[IRTModel] = None,
        target_se: float = 0.35,
        min_items: int = 3,
        max_items: int = 10,
    ):
        self.irt = irt_model or IRTModel()
        self.target_se = target_se
        self.min_items = min_items
        self.max_items = max_items

    def select_next_question(
        self,
        item_pool: List[IRTItem],
        administered_history: List[tuple[IRTItem, bool]],
        current_theta: float = 0.0,
    ) -> CATSelectionResult:
        """
        Select next optimal question from pool using Maximum Information Criterion.
        
        Args:
            item_pool: Available candidate IRT items.
            administered_history: History of (item, response) pairs already taken.
            current_theta: Initial theta prior before history.
            
        Returns:
            CATSelectionResult with next item, ability state, and completion flag.
        """
        administered_ids: Set[str] = {item.item_id for item, _ in administered_history}
        n_taken = len(administered_history)

        # Estimate current ability theta and SE
        ability = self.irt.estimate_ability(administered_history, initial_theta=current_theta)

        # Check stopping criteria
        if n_taken >= self.max_items:
            return CATSelectionResult(
                next_item=None,
                current_ability=ability,
                is_complete=True,
                reason="Max items reached",
            )

        if n_taken >= self.min_items and ability.standard_error <= self.target_se:
            return CATSelectionResult(
                next_item=None,
                current_ability=ability,
                is_complete=True,
                reason=f"Target precision reached (SE = {ability.standard_error})",
            )

        # Filter out already administered items
        candidates = [item for item in item_pool if item.item_id not in administered_ids]

        if not candidates:
            return CATSelectionResult(
                next_item=None,
                current_ability=ability,
                is_complete=True,
                reason="Item pool exhausted",
            )

        # Maximize Fisher Information at estimated theta
        best_item = max(
            candidates,
            key=lambda item: self.irt.fisher_information(
                ability.theta, item.discrimination, item.difficulty
            ),
        )

        return CATSelectionResult(
            next_item=best_item,
            current_ability=ability,
            is_complete=False,
            reason="Selected via Maximum Fisher Information",
        )
