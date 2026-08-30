"""
Bayesian Knowledge Tracing (BKT) Model — Learn-it HCL ML Microservice

Probabilistic Hidden Markov Model (HMM) tracking learner skill mastery state (L_t).
Updates skill mastery probability after every learning activity or assessment attempt.

Parameters:
- P(L0): Initial knowledge prior (default: 0.10)
- P(T) : Transition / learning rate probability (default: 0.15)
- P(S) : Slip probability - incorrect response despite knowing skill (default: 0.10)
- P(G) : Guess probability - correct response despite not knowing skill (default: 0.20)
"""

from dataclasses import dataclass
from typing import Optional, List


@dataclass
class BKTParams:
    p_l0: float = 0.10  # Initial mastery prior
    p_t: float = 0.15   # Probability of learning (transition)
    p_s: float = 0.10   # Slip rate
    p_g: float = 0.20   # Guess rate


@dataclass
class BKTResult:
    mastery_prob: float        # P(L_t) after update [0.0 - 1.0]
    p_correct_pred: float      # Predicted probability student gets next attempt correct
    confidence: float          # Confidence in estimate [0.0 - 1.0]
    info_gain: float           # Information gain / KL-divergence from previous estimate


class BKTModel:
    """Standard and Extended Bayesian Knowledge Tracing engine."""

    def __init__(self, default_params: Optional[BKTParams] = None):
        self.params = default_params or BKTParams()

    def predict_correct(self, p_mastery: float, params: Optional[BKTParams] = None) -> float:
        """
        Calculate expected probability of learner giving a correct answer given current mastery.
        P(Correct) = P(L) * (1 - P(S)) + (1 - P(L)) * P(G)
        """
        p = params or self.params
        return p_mastery * (1.0 - p.p_s) + (1.0 - p_mastery) * p.p_g

    def update(
        self,
        current_mastery: float,
        is_correct: bool,
        item_weight: float = 1.0,
        params: Optional[BKTParams] = None,
    ) -> BKTResult:
        """
        Perform Bayesian update given an observed attempt (correct/incorrect).
        
        Args:
            current_mastery: Current estimated probability P(L_{t-1})
            is_correct: Boolean outcome of student attempt
            item_weight: Weight modifier for exercise quality (0.5 to 1.5)
            params: Optional custom BKT parameters for specific skill/item
            
        Returns:
            BKTResult containing updated mastery probability and metrics.
        """
        p = params or self.params
        p_l = max(0.001, min(0.999, current_mastery))

        # Effective slip and guess adjusted for item difficulty/weight
        p_s = max(0.01, min(0.40, p.p_s / max(0.1, item_weight)))
        p_g = max(0.01, min(0.40, p.p_g / max(0.1, item_weight)))
        p_t = max(0.01, min(0.50, p.p_t * item_weight))

        # Step 1: Posterior probability calculation given observation
        if is_correct:
            numerator = p_l * (1.0 - p_s)
            denominator = numerator + (1.0 - p_l) * p_g
        else:
            numerator = p_l * p_s
            denominator = numerator + (1.0 - p_l) * (1.0 - p_g)

        p_posterior = numerator / max(1e-9, denominator)

        # Step 2: Learning transition update (student may learn from attempt)
        p_l_next = p_posterior + (1.0 - p_posterior) * p_t
        p_l_next = max(0.0, min(1.0, p_l_next))

        # Predicted P(Correct) for next trial
        p_correct_pred = self.predict_correct(p_l_next, p)

        # Confidence metric (increases as P(L) approaches 0 or 1)
        confidence = 1.0 - 2.0 * abs(0.5 - p_l_next)

        # Information gain (simple absolute change in belief)
        info_gain = abs(p_l_next - current_mastery)

        return BKTResult(
            mastery_prob=p_l_next,
            p_correct_pred=p_correct_pred,
            confidence=confidence,
            info_gain=info_gain,
        )

    def sequence_update(
        self,
        initial_mastery: float,
        responses: List[bool],
        weights: Optional[List[float]] = None,
    ) -> List[BKTResult]:
        """Process a continuous sequence of responses for a student on a skill."""
        results = []
        current = initial_mastery
        for i, resp in enumerate(responses):
            w = weights[i] if weights and i < len(weights) else 1.0
            res = self.update(current, resp, item_weight=w)
            results.append(res)
            current = res.mastery_prob
        return results

    def save(self, filepath: str = "saved_models/bkt_model.joblib") -> str:
        """Save trained BKT model to disk using joblib or pickle."""
        from app.modules.common.model_persistence import save_ml_model
        return save_ml_model(self, filepath)

    @classmethod
    def load(cls, filepath: str = "saved_models/bkt_model.joblib") -> "BKTModel":
        """Load trained BKT model from disk using joblib or pickle."""
        from app.modules.common.model_persistence import load_ml_model
        return load_ml_model(filepath)

