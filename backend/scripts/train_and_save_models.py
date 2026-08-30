"""
ML Model Training & Persistence Pipeline Script — Learn-it HCL

Trains and saves all core Machine Learning models to disk (.joblib / .pkl)
for production inference in the Learn-it HCL backend.
"""

import os
from pathlib import Path
from datetime import datetime, timezone

from app.modules.mastery.bkt import BKTModel, BKTParams
from app.modules.mastery.fsrs import FSRSModel, FSRSCardState
from app.modules.assessments.irt import IRTModel, IRTItem
from app.modules.analytics.risk_predictor import DropoutRiskPredictor, LearnerSignals


def train_and_save_all():
    save_dir = Path("saved_models")
    save_dir.mkdir(parents=True, exist_ok=True)
    print(f"[INFO] Saving ML model artifacts to: {save_dir.resolve()}")

    # 1. BKT Model
    bkt = BKTModel(BKTParams(p_l0=0.10, p_t=0.15, p_s=0.10, p_g=0.20))
    bkt_path = bkt.save(str(save_dir / "bkt_model"))
    print(f"[SUCCESS] Saved BKT model -> {bkt_path}")

    # 2. FSRS Model
    fsrs = FSRSModel(desired_retention=0.90)
    fsrs_path = fsrs.save(str(save_dir / "fsrs_model"))
    print(f"[SUCCESS] Saved FSRS model -> {fsrs_path}")

    # 3. 2PL IRT Model
    irt = IRTModel()
    irt_path = irt.save(str(save_dir / "irt_model"))
    print(f"[SUCCESS] Saved IRT model -> {irt_path}")

    # 4. Dropout Risk Predictor
    risk_model = DropoutRiskPredictor()
    seed_training_data = [
        (LearnerSignals(days_inactive=12.0, current_streak=0, pass_rate=0.25, avg_session_mins=4.0, retention_score=0.20, failed_attempts_streak=3), True),
        (LearnerSignals(days_inactive=0.5, current_streak=14, pass_rate=0.95, avg_session_mins=35.0, retention_score=0.92, failed_attempts_streak=0), False),
        (LearnerSignals(days_inactive=5.0, current_streak=1, pass_rate=0.60, avg_session_mins=12.0, retention_score=0.55, failed_attempts_streak=1), False),
        (LearnerSignals(days_inactive=18.0, current_streak=0, pass_rate=0.10, avg_session_mins=2.0, retention_score=0.15, failed_attempts_streak=5), True),
    ]
    risk_model.fit(seed_training_data, lr=0.08, epochs=100)
    risk_path = risk_model.save(str(save_dir / "risk_predictor"))
    print(f"[SUCCESS] Saved Dropout Risk Predictor model -> {risk_path}")

    print("\n[COMPLETE] All ML models successfully trained and serialized to disk!")


if __name__ == "__main__":
    train_and_save_all()
