"""
ML Model Persistence Utility — Learn-it HCL

Saves and loads trained machine learning model artifacts using joblib or pickle.
"""

import os
from pathlib import Path
from typing import Any

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    import pickle
    HAS_JOBLIB = False


def save_ml_model(model_obj: Any, filepath: str | Path) -> str:
    """
    Save a trained ML model object to disk using joblib or pickle.
    Creates parent directories automatically if needed.
    """
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)

    if HAS_JOBLIB:
        if path.suffix not in [".joblib", ".pkl"]:
            path = path.with_suffix(".joblib")
        joblib.dump(model_obj, path)
    else:
        if path.suffix not in [".joblib", ".pkl"]:
            path = path.with_suffix(".pkl")
        with open(path, "wb") as f:
            pickle.dump(model_obj, f)

    return str(path)


def load_ml_model(filepath: str | Path) -> Any:
    """
    Load a trained ML model object from disk.
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"ML model file not found at: {path}")

    if HAS_JOBLIB:
        return joblib.load(path)
    else:
        with open(path, "rb") as f:
            return pickle.load(f)
