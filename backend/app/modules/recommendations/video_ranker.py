"""
Neural Video Ranking Model — Semantic Matching
Learn-it HCL ML Microservice

Trains a lightweight MLP ranker on (topic_embedding, learner_ability, duration) -> relevance_score.
Uses PyTorch — auto-uses CUDA GPU if available, falls back to CPU.

Key fixes vs v1:
  - forward() directly calls self.net (no circular .out() indirection)
  - Binary labels (1.0 / 0.0) only — cleaner gradient signal
  - Data augmentation via Gaussian noise → 4× more samples (540 from 135)
  - Simpler 3-layer architecture (better for small dataset, less overfitting)
  - MSELoss instead of BCELoss — more stable with small datasets
  - Input: [tier_ability(1) | duration_norm(1) | topic_idx_onehot(5)] = 7 features
    (removed 384-d sentence embedding — too many dims for 135 samples)
"""

import json
import os
import random
from pathlib import Path
from typing import Optional

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_SBERT = True
except ImportError:
    HAS_SBERT = False

from app.modules.common.model_persistence import save_ml_model, load_ml_model

# ─────────────────────────────────────────────────────────────
# Device Detection
# ─────────────────────────────────────────────────────────────

def get_device() -> "torch.device":
    if HAS_TORCH:
        if torch.cuda.is_available():
            device = torch.device("cuda")
            print(f"[GPU] Using CUDA: {torch.cuda.get_device_name(0)}")
        else:
            device = torch.device("cpu")
            print("[INFO] CUDA not available — training on CPU")
        return device
    return None


# ─────────────────────────────────────────────────────────────
# Neural Ranker Architecture (v2 — fixed)
# ─────────────────────────────────────────────────────────────

KNOWN_TOPICS = ["react", "python", "data_structures", "sql", "machine_learning"]
INPUT_DIM = 2 + len(KNOWN_TOPICS)  # ability + duration + topic_onehot = 7

if HAS_TORCH:
    class VideoRankerNet(nn.Module):
        """
        Small 3-layer MLP scoring video-learner relevance.
        Input (7 dims): [ability_norm, duration_norm, topic_onehot×5]
        Output: scalar relevance in [0, 1]
        """
        def __init__(self, input_dim: int = INPUT_DIM):
            super().__init__()
            self.net = nn.Sequential(
                nn.Linear(input_dim, 32),
                nn.ReLU(),
                nn.Linear(32, 16),
                nn.ReLU(),
                nn.Linear(16, 1),
                nn.Sigmoid(),
            )

        def forward(self, x: "torch.Tensor") -> "torch.Tensor":
            return self.net(x).squeeze(-1)


# ─────────────────────────────────────────────────────────────
# Embedding Utility (still available for semantic search uses)
# ─────────────────────────────────────────────────────────────

_sbert_model: Optional[object] = None

def get_embedder():
    global _sbert_model
    if _sbert_model is None and HAS_SBERT:
        print("[INFO] Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        _sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _sbert_model


def embed_text(text: str) -> list[float]:
    """Return 384-dim sentence embedding. Falls back to zero vector if unavailable."""
    embedder = get_embedder()
    if embedder is None:
        return [0.0] * 384
    vec = embedder.encode([text], convert_to_numpy=True)[0]
    return vec.tolist()


# ─────────────────────────────────────────────────────────────
# Feature Engineering
# ─────────────────────────────────────────────────────────────

TIER_ABILITY_MAP = {"beginner": 0.15, "intermediate": 0.50, "advanced": 0.85}

# Hard binary labels: 1.0 = good match, 0.0 = bad match
# Intermediate partial matches included to add gradient signal
TIER_LABEL_MAP = {
    ("beginner",     "beginner"):     1.0,
    ("beginner",     "intermediate"): 0.2,
    ("beginner",     "advanced"):     0.0,
    ("intermediate", "beginner"):     0.2,
    ("intermediate", "intermediate"): 1.0,
    ("intermediate", "advanced"):     0.2,
    ("advanced",     "beginner"):     0.0,
    ("advanced",     "intermediate"): 0.2,
    ("advanced",     "advanced"):     1.0,
}

def make_feature(topic: str, ability: float, duration_mins: int) -> list[float]:
    """Build a 7-dim feature vector: [ability, duration_norm, topic_onehot×5]."""
    duration_norm = min(1.0, duration_mins / 480.0)
    onehot = [1.0 if t == topic else 0.0 for t in KNOWN_TOPICS]
    return [ability, duration_norm] + onehot


# ─────────────────────────────────────────────────────────────
# Training Data Generator
# ─────────────────────────────────────────────────────────────

def build_training_data(
    catalogue_path: str = None,
    augment_noise: float = 0.03,
    augment_factor: int = 4,
) -> tuple:
    """
    Build training pairs from the curated video catalogue with Gaussian augmentation.

    Args:
        augment_noise: Std of Gaussian noise added for augmentation
        augment_factor: How many noisy copies of each sample to generate
    Returns: (X tensor [N×7], y tensor [N])
    """
    if not HAS_TORCH:
        raise RuntimeError("PyTorch required for neural ranker training.")

    if catalogue_path is None:
        catalogue_path = Path(__file__).parent.parent.parent / "data" / "video_catalogue.json"

    with open(catalogue_path, "r") as f:
        catalogue = json.load(f)

    X_rows, y_rows = [], []

    for topic_key, tiers in catalogue.items():
        for learner_tier, learner_ability in TIER_ABILITY_MAP.items():
            for video_tier, videos in tiers.items():
                label = TIER_LABEL_MAP.get((learner_tier, video_tier), 0.1)
                for video in videos:
                    feat = make_feature(topic_key, learner_ability, video["duration_mins"])
                    X_rows.append(feat)
                    y_rows.append(label)
                    # Gaussian augmentation — small noise on scalar features only
                    for _ in range(augment_factor):
                        noise = [
                            feat[0] + random.gauss(0, augment_noise),
                            max(0.0, min(1.0, feat[1] + random.gauss(0, augment_noise))),
                        ] + feat[2:]  # Topic onehot stays unchanged
                        X_rows.append(noise)
                        y_rows.append(label)

    X = torch.tensor(X_rows, dtype=torch.float32)
    y = torch.tensor(y_rows, dtype=torch.float32)
    return X, y


# ─────────────────────────────────────────────────────────────
# Training Pipeline
# ─────────────────────────────────────────────────────────────

def train_video_ranker(
    epochs: int = 300,
    batch_size: int = 64,
    lr: float = 5e-3,
    save_path: str = "saved_models/video_ranker.pt",
) -> "VideoRankerNet":
    """
    Train the VideoRankerNet. Uses GPU if available, otherwise CPU.
    """
    if not HAS_TORCH:
        print("[WARN] PyTorch not installed — skipping neural ranker training.")
        return None

    device = get_device()

    print("[TRAIN] Building training data...")
    X, y = build_training_data()
    print(f"[TRAIN] Dataset: {X.shape[0]} samples | {X.shape[1]} features")
    print(f"[TRAIN] Label distribution — positive (>=0.5): {(y >= 0.5).sum().item()} "
          f"| negative: {(y < 0.5).sum().item()}")

    X, y = X.to(device), y.to(device)
    dataset = TensorDataset(X, y)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model = VideoRankerNet(input_dim=X.shape[1]).to(device)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-3)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = nn.MSELoss()  # More stable than BCE for small datasets

    print(f"[TRAIN] Training on {str(device).upper()} for {epochs} epochs...")
    model.train()
    best_loss = float("inf")
    best_state = None

    for epoch in range(epochs):
        total_loss = 0.0
        for X_batch, y_batch in loader:
            optimizer.zero_grad()
            preds = model(X_batch)
            loss = criterion(preds, y_batch)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            total_loss += loss.item()
        scheduler.step()
        avg_loss = total_loss / len(loader)
        if avg_loss < best_loss:
            best_loss = avg_loss
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        if (epoch + 1) % 50 == 0:
            print(f"  Epoch [{epoch+1:>3}/{epochs}] Loss: {avg_loss:.4f} (best: {best_loss:.4f})")

    # Restore best weights
    if best_state:
        model.load_state_dict(best_state)
        print(f"[TRAIN] Restored best model (loss={best_loss:.4f})")

    save_dir = Path(save_path).parent
    save_dir.mkdir(parents=True, exist_ok=True)
    torch.save({
        "state_dict": model.state_dict(),
        "input_dim": X.shape[1],
        "best_loss": best_loss,
    }, save_path)
    print(f"[SAVE] Neural ranker saved to: {save_path}")
    return model


# ─────────────────────────────────────────────────────────────
# Load
# ─────────────────────────────────────────────────────────────

def load_video_ranker(
    model_path: str = "saved_models/video_ranker.pt",
) -> Optional["VideoRankerNet"]:
    """Load saved VideoRankerNet from disk."""
    if not HAS_TORCH:
        return None
    path = Path(model_path)
    if not path.exists():
        return None
    device = get_device()
    checkpoint = torch.load(model_path, map_location=device, weights_only=True)
    input_dim = checkpoint.get("input_dim", INPUT_DIM)
    model = VideoRankerNet(input_dim=input_dim).to(device)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    best_loss = checkpoint.get("best_loss", "?")
    print(f"[LOAD] Neural ranker loaded from: {model_path} (best_loss={best_loss:.4f})")
    return model
