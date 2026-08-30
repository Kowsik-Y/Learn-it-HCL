"""
Automated Unit Tests & Verification for Learn-it HCL ML Models

Tests training, model saving (.joblib / .pkl), loading, and predictions for:
- Bayesian Knowledge Tracing (BKT)
- Free Spaced Repetition Scheduler (FSRS)
- 2PL Item Response Theory (IRT)
- Computerized Adaptive Testing (CAT Engine)
- Dropout Risk Predictor
"""

import os
import shutil
from pathlib import Path
from datetime import datetime, timezone

from app.modules.mastery.bkt import BKTModel, BKTParams
from app.modules.mastery.fsrs import FSRSModel, FSRSCardState
from app.modules.assessments.irt import IRTModel, IRTItem
from app.modules.assessments.cat_engine import CATEngine
from app.modules.analytics.risk_predictor import DropoutRiskPredictor, LearnerSignals


def test_bkt_and_persistence(tmp_path: Path):
    model = BKTModel(BKTParams(p_l0=0.15, p_t=0.20, p_s=0.08, p_g=0.15))
    res1 = model.update(current_mastery=0.2, is_correct=True)
    assert res1.mastery_prob > 0.2, "Mastery should increase after correct answer"

    save_path = tmp_path / "bkt_model.joblib"
    saved_file = model.save(str(save_path))
    assert Path(saved_file).exists(), "BKT Model file should exist on disk"

    loaded_model = BKTModel.load(saved_file)
    res2 = loaded_model.update(current_mastery=0.2, is_correct=True)
    assert round(res1.mastery_prob, 5) == round(res2.mastery_prob, 5), "Loaded BKT predictions must match"
    print("[OK] BKT Model & Persistence Test Passed!")



def test_fsrs_and_persistence(tmp_path: Path):
    fsrs = FSRSModel(desired_retention=0.90)
    card = FSRSCardState(difficulty=5.0, stability=2.0)
    out1 = fsrs.review(card, rating=3) # Good recall

    save_path = tmp_path / "fsrs_model.joblib"
    saved_file = fsrs.save(str(save_path))
    assert Path(saved_file).exists(), "FSRS Model file should exist on disk"

    loaded_fsrs = FSRSModel.load(saved_file)
    out2 = loaded_fsrs.review(card, rating=3)
    assert out1.new_stability == out2.new_stability, "Loaded FSRS stability must match"
    print("[OK] FSRS Model & Persistence Test Passed!")


def test_irt_and_cat(tmp_path: Path):
    irt = IRTModel()
    items = [
        IRTItem("q1", difficulty=-1.5, discrimination=1.2),
        IRTItem("q2", difficulty=0.0, discrimination=1.5),
        IRTItem("q3", difficulty=1.5, discrimination=1.1),
    ]

    history = [(items[0], True), (items[1], True)]
    ability = irt.estimate_ability(history)
    assert ability.theta > 0.0, "Ability should be positive after two correct answers"

    cat = CATEngine(irt_model=irt)
    selection = cat.select_next_question(item_pool=items, administered_history=history)
    assert selection.next_item is not None
    assert selection.next_item.item_id == "q3", "CAT should select item closest to current ability"

    save_path = tmp_path / "irt_model.joblib"
    saved_file = irt.save(str(save_path))
    assert Path(saved_file).exists(), "IRT Model file should exist on disk"
    print("[OK] IRT & CAT Engine Test Passed!")


def test_risk_predictor_training_and_persistence(tmp_path: Path):
    predictor = DropoutRiskPredictor()

    # Create dummy training data
    dummy_data = [
        (LearnerSignals(days_inactive=10, current_streak=0, pass_rate=0.2, avg_session_mins=5, retention_score=0.2, failed_attempts_streak=4), True), # Churned
        (LearnerSignals(days_inactive=0, current_streak=7, pass_rate=0.9, avg_session_mins=30, retention_score=0.9, failed_attempts_streak=0), False), # Active
    ]

    predictor.fit(dummy_data, lr=0.1, epochs=50)

    save_path = tmp_path / "risk_predictor.joblib"
    saved_file = predictor.save(str(save_path))
    assert Path(saved_file).exists(), "Risk Predictor Model file should exist on disk"

    loaded_predictor = DropoutRiskPredictor.load(saved_file)
    active_eval = loaded_predictor.predict(dummy_data[1][0])
    churn_eval = loaded_predictor.predict(dummy_data[0][0])

    assert churn_eval.risk_score > active_eval.risk_score, "Churned student must have higher risk score"
    print("[OK] Dropout Risk Predictor Training & Persistence Test Passed!")


if __name__ == "__main__":
    import tempfile
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_p = Path(tmp_dir)
        test_bkt_and_persistence(tmp_p)
        test_fsrs_and_persistence(tmp_p)
        test_irt_and_cat(tmp_p)
        test_risk_predictor_training_and_persistence(tmp_p)
        print("\nALL ML MODEL PERSISTENCE TESTS PASSED SUCCESSFULLY!")

