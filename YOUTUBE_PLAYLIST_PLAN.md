# 🎬 YouTube Adaptive Custom Playlist Feature — Plan & Devil's Advocate Review
> Plan for: **ML-Driven Custom YouTube Playlist Generation per course, per learner**
> Cross-examined critically against real constraints.

---

## 📋 Current State (What We Actually Have)

Before planning improvements, let's be brutally honest about what exists:

| Component | Status | Reality Check |
|---|---|---|
| `agent.py` → `fetch_videos()` | Generates YouTube **search URLs**, not playlists | Just appends topic string to `youtube.com/results?search_query=` — a search link, NOT an embedded video |
| `agent.py` → lesson `video_url` | Also YouTube search URL | Same issue — not a real video |
| BKT `bkt.py` | Works standalone | **Not wired to course agent at all** — no integration |
| FSRS `fsrs.py` | Works standalone | **Not wired to any UI or scheduler** |
| IRT / CAT | Works standalone | **Not connected to quiz generator** |
| Risk Predictor | Works standalone | **No frontend trigger** |
| `saved_models/*.joblib` | Serialized to disk | **Never loaded at inference time** — models are re-initialized fresh on every request |

> **Blunt summary**: The ML models are mathematically correct but informationally isolated — they are not feeding into any actual course or video recommendation decision. This is the most important gap to fix before the pitch.

---

## 💡 Proposed Feature: ML-Driven YouTube Custom Playlist Per Course

### What Exactly Should It Do?

Instead of dumping a generic YouTube search URL per lesson, we build a **ranked, personalized video playlist** per course that:

1. **Selects videos by learner ability level** — not just by topic keyword.
2. **Sequences videos by mastery progression** — beginner → intermediate → advanced, triggered by BKT score thresholds.
3. **Adjusts video depth using FSRS retention score** — if the learner's retention for a concept is low, re-surface a different video explaining the same concept differently.
4. **Tracks video engagement as mastery evidence** — completion percentage and quiz result after video feeds back into the BKT model.

---

## 🏗️ Architecture Plan

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │               ML-DRIVEN YOUTUBE PLAYLIST ENGINE                             │
 └─────────────────────────────────────────────────────────────────────────────┘

  [1] COURSE CREATION TIME (agent.py generates roadmap)
      │
      ▼
  ┌──────────────────────────────────────────────────────┐
  │  PlaylistGenerator.generate(topic, modules)          │
  │  For each lesson / sub-skill:                        │
  │    • Search query = topic + skill + difficulty_tag   │
  │    • Assign 3 video slots per lesson:                │
  │      [beginner, intermediate, advanced]              │
  └──────────────────────────────────────────────────────┘
      │
      ▼
  [2] LEARNER RUNTIME (lesson opened)
      │
      ├── Fetch current BKT mastery score for this skill
      │     • P(L) < 0.30 → serve "beginner" video slot
      │     • P(L) 0.30–0.65 → serve "intermediate" video slot
      │     • P(L) > 0.65 → serve "advanced" video slot
      │
      ├── Fetch FSRS retention estimate for this skill
      │     • Retention < 0.50 → override: serve a "re-explanation" video
      │       (different channel / style than the one served before)
      │
      └── Return: { video_id, playlist_order, reason_for_selection }

  [3] POST-VIDEO ENGAGEMENT TRACKING
      │
      ├── Frontend reports: watch_percentage, quiz_result_after_video
      │
      └── ML Evidence Pipeline:
            • Feed (watch_percentage > 0.80 + correct_quiz) → BKT.update(correct=True, weight=0.6)
            • Feed (watch_percentage < 0.30) → flag as low engagement
            • Feed (quiz_failed after video) → BKT.update(correct=False)
            • FSRS: increment stability after successful review via video
```

---

## 📁 Proposed New Files

### `backend/app/modules/recommendations/playlist_engine.py`
Core ML playlist selector — uses BKT scores + FSRS retention + IRT difficulty to pick the right video slot.

### `backend/app/modules/recommendations/playlist_router.py`
FastAPI endpoint:
- `GET /api/ml/playlist/{course_id}/{skill_id}` → returns ranked video for learner
- `POST /api/ml/playlist/event` → accepts video engagement event (watch %, quiz result)

### Frontend: `apps/web/components/adaptive-video-player.tsx`
Replaces static `video_url` iframe with a component that:
- Shows current video selected by ML
- Shows "why this video" explanation (explainability)
- Reports back watch progress

---

## 📊 The ML Signal → Video Mapping

| ML Signal | Source | Video Decision |
|---|---|---|
| `BKT mastery_prob < 0.30` | `bkt.py` | Serve "beginner" tier — foundational overview video |
| `BKT mastery_prob 0.30–0.65` | `bkt.py` | Serve "intermediate" tier — deeper implementation video |
| `BKT mastery_prob > 0.65` | `bkt.py` | Serve "advanced" tier — edge cases & system design video |
| `FSRS retention < 0.50` | `fsrs.py` | Override to "re-explanation" — different pedagogical style |
| `IRT theta < -1.0` | `irt.py` | Ensure video is max 10 min (low ability = shorter content) |
| `Risk score > 60%` | `risk_predictor.py` | Surface a "motivational short" before content video |
| `evidence_count < 2` | mastery state | Default to "beginner" — not enough data to decide |

---

## ✅ What Connects What (Integration Map)

```
agent.py (generate_roadmap)
    │
    └─► lesson.video_url [CURRENTLY: raw YouTube search link]
              │
              ▼  [REPLACE WITH]
    PlaylistEngine.get_video_for_learner(skill_id, learner_id)
              │
              ├─ reads: MasteryState.mastery_score (BKT output)
              ├─ reads: MasteryState.retention_estimate (FSRS output)
              ├─ reads: ability estimate from IRT (if quiz history exists)
              └─ returns: { video_url, video_title, tier, reason }
```

---

## 😈 Devil's Advocate — Critical Challenges & Honest Gaps

### ❌ Challenge 1: YouTube Has No Approved Ranking API for This
**Reality**: The YouTube Data API v3 allows searching and metadata retrieval (free, 10,000 units/day), **but we cannot programmatically retrieve video engagement quality, accuracy, or educational value**. We would be picking from search results blindly without knowing:
- Is the video accurate?
- Is it from a reputable channel?
- Is it up-to-date?

**Mitigation**: Curate a **static approved video catalogue** per skill/topic (JSON or DB table), then ML selects from that curated pool. This is the only robust solution. Random search results are unreliable.

---

### ❌ Challenge 2: BKT is NOT Currently Wired to the Course Agent
**Reality**: Right now, `agent.py` does not import or call `bkt.py` at any point. The models run independently. Connecting them requires:
- A `learner_id` available in the course agent context.
- A database lookup for the current mastery state.
- A decision layer in the playlist engine.

**Mitigation**: This is solvable — add `learner_id` and `skill_id` to the `AgentState` TypedDict, and inject a `MasteryService` call inside `fetch_videos()`.

---

### ❌ Challenge 3: No Real Video Watch-Time Tracking Exists
**Reality**: We currently have no frontend mechanism to track how long a learner watches a video. The lesson workspace embeds a `video_url` link but there is no event listener, completion hook, or watch percentage measurement.

**Mitigation**: Add a YouTube IFrame API wrapper in the frontend (`adaptive-video-player.tsx`) that fires events at 25%, 50%, 75%, and 100% completion. These events then call `POST /api/ml/playlist/event` to update BKT.

---

### ❌ Challenge 4: "88%+ Dropout Accuracy" Claim in Pitch is Unsubstantiated
**Reality**: The pitch script says *"Our Dropout Risk Predictor identifies at-risk students with 88%+ accuracy"* — but we have **zero real training data**. The risk predictor was trained on 4 synthetic dummy rows (in `train_and_save_models.py`). This claim will collapse under any technical judge's scrutiny.

**Mitigation**: Remove this accuracy claim from the pitch entirely. Replace it with: *"Our Dropout Risk Predictor flags learners showing inactivity, failure streaks, and low retention — enabling proactive nudges before disengagement."* No fake metrics.

---

### ❌ Challenge 5: IRT Needs Item Calibration Data
**Reality**: The 2PL IRT model estimates learner ability `theta` but the quiz questions generated by the agent have **no calibrated difficulty or discrimination parameters**. Without pre-calibrated item parameters `(a, b)`, the IRT ability estimate is meaningless.

**Mitigation**: When the LLM generates questions, also ask it to estimate a `difficulty_level` (easy/medium/hard) for each question. Map: easy → b=-1.0, medium → b=0.0, hard → b=1.5. This is a rough approximation but makes IRT functional.

---

### ❌ Challenge 6: No YouTube Video Catalogue Exists Yet
**Reality**: To run the playlist engine properly, we need a curated catalogue of real YouTube videos per topic + difficulty tier. This does not exist. Right now everything is a search URL.

**Mitigation (Hackathon-viable)**: Build a small **seed catalogue** for 5 common topics (React, Python, Data Structures, SQL, Machine Learning) with 3 tiers × 3 videos each = 45 real curated video IDs. Store in a JSON config file. ML selects from this pool.

---

## 🛣️ Recommended Implementation Order (Priority Sequencing)

### Phase 1 — Fix the Honesty Gaps (1–2 hours)
1. Remove the fake "88% accuracy" claim from the pitch script.
2. Add real video IDs to a curated seed catalogue (`video_catalogue.json`).
3. Wire `BKT.update()` to the mastery evidence pipeline after quiz submission.

### Phase 2 — Connect ML to Course Agent (2–3 hours)
4. Add `learner_id` and `mastery_score` to `AgentState`.
5. Build `PlaylistEngine.get_video_for_learner()`.
6. Replace `fetch_videos()` search URLs with playlist engine output.

### Phase 3 — Frontend Watch Tracking (2–3 hours)
7. Build `adaptive-video-player.tsx` with YouTube IFrame API.
8. Implement watch event → `POST /api/ml/playlist/event` → BKT update.
9. Show "Why this video?" explainability tooltip.

### Phase 4 — IRT Calibration Patch (1 hour)
10. Add `difficulty_level` field to LLM-generated questions.
11. Map difficulty labels to IRT `b` parameters.
12. Wire IRT `theta` into playlist tier selection.

---

## 📈 Expected Impact (Realistic, Verifiable)

| Metric | Before | After (Expected) |
|---|---|---|
| Video relevance to learner level | Random (search result #1) | Tiered by BKT mastery score |
| Video re-exposure when forgotten | Never | FSRS triggers re-surface when R < 0.50 |
| Mastery update after video | Never | BKT updated from watch% + quiz |
| Explainability | None | "You got this video because your mastery is 32% — here's a beginner explanation" |

---

## 🔗 Related Files to Modify

- [agent.py](file:///c:/Users/renug/Hcl/Learn-it-HCL/backend/app/modules/ai_course_agent/agent.py) — Add learner context, replace `fetch_videos` with playlist engine
- [bkt.py](file:///c:/Users/renug/Hcl/Learn-it-HCL/backend/app/modules/mastery/bkt.py) — Already working, needs wiring
- [fsrs.py](file:///c:/Users/renug/Hcl/Learn-it-HCL/backend/app/modules/mastery/fsrs.py) — Already working, needs retention read
- [risk_predictor.py](file:///c:/Users/renug/Hcl/Learn-it-HCL/backend/app/modules/analytics/risk_predictor.py) — Already working, needs frontend trigger
