"""
2-Parameter Logistic (2PL) Item Response Theory (IRT) — Learn-it HCL ML Microservice

Models item difficulty (b), discrimination (a), and learner ability (theta).
Used for precise diagnostic scoring and question calibration.
"""

import math
from dataclasses import dataclass
from typing import List, Tuple, Optional


@dataclass
class IRTItem:
    item_id: str
    difficulty: float = 0.0     # b parameter [-3.0 to +3.0]
    discrimination: float = 1.0 # a parameter [0.2 to 3.0]


@dataclass
class AbilityEstimate:
    theta: float                # Estimated latent ability [-4.0 to +4.0]
    standard_error: float       # Standard error SE(theta)
    total_items: int


class IRTModel:
    """2PL Item Response Theory scoring and estimation engine."""

    @staticmethod
    def probability(theta: float, a: float, b: float) -> float:
        """
        2PL IRT Probability function P(X = 1 | theta, a, b).
        P = 1 / (1 + exp(-a * (theta - b)))
        """
        val = -a * (theta - b)
        val = max(-20.0, min(20.0, val))  # Prevent numerical overflow
        return 1.0 / (1.0 + math.exp(val))

    @staticmethod
    def fisher_information(theta: float, a: float, b: float) -> float:
        """
        Fisher Information I(theta) for item j.
        I(theta) = a^2 * P(theta) * (1 - P(theta))
        """
        p = IRTModel.probability(theta, a, b)
        return (a ** 2) * p * (1.0 - p)

    def estimate_ability(
        self,
        responses: List[Tuple[IRTItem, bool]],
        initial_theta: float = 0.0,
        max_iter: int = 20,
        tol: float = 0.001,
    ) -> AbilityEstimate:
        """
        Estimate learner ability (theta) using Newton-Raphson Maximum Likelihood Estimation (MLE).
        
        Args:
            responses: List of (IRTItem, response_is_correct) pairs.
            initial_theta: Starting theta guess.
            max_iter: Max Newton-Raphson iterations.
            tol: Convergence tolerance.
            
        Returns:
            AbilityEstimate containing estimated theta and standard error.
        """
        if not responses:
            return AbilityEstimate(theta=initial_theta, standard_error=1.0, total_items=0)

        # Edge cases: all correct or all incorrect (MLE bounds)
        n_correct = sum(1 for _, resp in responses if resp)
        if n_correct == 0:
            return AbilityEstimate(theta=-3.0, standard_error=0.9, total_items=len(responses))
        if n_correct == len(responses):
            return AbilityEstimate(theta=3.0, standard_error=0.9, total_items=len(responses))

        theta = initial_theta

        for _ in range(max_iter):
            first_derivative = 0.0
            second_derivative = 0.0

            for item, is_correct in responses:
                p = self.probability(theta, item.discrimination, item.difficulty)
                y = 1.0 if is_correct else 0.0
                a = item.discrimination

                # First derivative of log-likelihood wrt theta
                first_derivative += a * (y - p)
                # Second derivative of log-likelihood wrt theta
                second_derivative -= (a ** 2) * p * (1.0 - p)

            if abs(second_derivative) < 1e-9:
                break

            delta = first_derivative / second_derivative
            theta_next = theta - delta

            # Clamp theta to reasonable domain [-4.0, +4.0]
            theta_next = max(-4.0, min(4.0, theta_next))

            if abs(theta_next - theta) < tol:
                theta = theta_next
                break

            theta = theta_next

        # Standard error SE(theta) = 1 / sqrt(Total Fisher Information)
        total_info = sum(
            self.fisher_information(theta, item.discrimination, item.difficulty)
            for item, _ in responses
        )
        se = 1.0 / math.sqrt(max(1e-4, total_info))

        return AbilityEstimate(
            theta=round(theta, 3),
            standard_error=round(se, 3),
            total_items=len(responses),
        )

    def save(self, filepath: str = "saved_models/irt_model.joblib") -> str:
        """Save trained IRT model to disk using joblib or pickle."""
        from app.modules.common.model_persistence import save_ml_model
        return save_ml_model(self, filepath)

    @classmethod
    def load(cls, filepath: str = "saved_models/irt_model.joblib") -> "IRTModel":
        """Load trained IRT model from disk using joblib or pickle."""
        from app.modules.common.model_persistence import load_ml_model
        return load_ml_model(filepath)

