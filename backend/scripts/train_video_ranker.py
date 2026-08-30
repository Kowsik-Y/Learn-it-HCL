"""
GPU Training Script — Neural Video Ranker
Learn-it HCL

Trains the VideoRankerNet on your NVIDIA RTX 4060 Laptop GPU.
Run: python scripts/train_video_ranker.py
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.modules.recommendations.video_ranker import (
    HAS_TORCH,
    HAS_SBERT,
    get_device,
    build_training_data,
    train_video_ranker,
    load_video_ranker,
    VideoRankerNet,
)


def main():
    print("=" * 60)
    print("  Learn-it HCL — Neural Video Ranker GPU Training")
    print("=" * 60)

    if not HAS_TORCH:
        print("[ERROR] PyTorch is not installed. Run:")
        print("  pip install torch --index-url https://download.pytorch.org/whl/cu121")
        sys.exit(1)

    if not HAS_SBERT:
        print("[ERROR] sentence-transformers is not installed. Run:")
        print("  pip install sentence-transformers")
        sys.exit(1)

    import torch
    device = get_device()
    print(f"\n[DEVICE] Training on: {device}")
    if torch.cuda.is_available():
        print(f"[GPU]    {torch.cuda.get_device_name(0)}")
        print(f"[VRAM]   {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

    # Build dataset
    print("\n[DATA] Loading curated video catalogue and generating embeddings...")
    t0 = time.time()
    X, y = build_training_data()
    print(f"[DATA] {X.shape[0]} training samples | {X.shape[1]} features | {time.time()-t0:.1f}s")

    # Train
    print("\n[TRAIN] Starting training...")
    t1 = time.time()
    model = train_video_ranker(
        epochs=300,
        batch_size=64,
        lr=5e-3,
        save_path="saved_models/video_ranker.pt",
    )
    print(f"[TRAIN] Completed in {time.time()-t1:.1f}s")

    # Verify load + inference
    print("\n[VERIFY] Loading saved model and running test inference...")
    import torch as _torch
    loaded = load_video_ranker("saved_models/video_ranker.pt")
    if loaded is not None:
        from app.modules.recommendations.video_ranker import make_feature
        _dev = get_device()
        feat_match    = make_feature("python", 0.15, 270)  # beginner ability → beginner video
        feat_mismatch = make_feature("python", 0.85, 270)  # advanced ability → beginner video
        X_test = _torch.tensor([feat_match, feat_mismatch], dtype=_torch.float32).to(_dev)
        with _torch.no_grad():
            scores = loaded(X_test).cpu().tolist()
        print(f"  Beginner ability vs beginner video -> score: {scores[0]:.4f}  (expect high)")
        print(f"  Advanced ability vs beginner video -> score: {scores[1]:.4f}  (expect low)")
        if scores[0] > scores[1]:
            print("[OK] Neural ranker correctly prefers matched tier!")
        else:
            print("[WARN] Scores not yet differentiated — model may need more data")
    else:
        print("[WARN] Could not verify loaded model.")

    print("\n[COMPLETE] Model artifact: saved_models/video_ranker.pt")
    print("           Playlist engine will auto-load this on next request.")



if __name__ == "__main__":
    main()
