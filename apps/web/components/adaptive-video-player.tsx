"use client";

import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PlaylistSelection {
  primary_video: {
    video_id: string;
    title: string;
    channel: string;
    duration_mins: number;
    embed_url: string;
    watch_url: string;
    tier: "beginner" | "intermediate" | "advanced";
  };
  fallback_video?: {
    video_id: string;
    title: string;
    embed_url: string;
    tier: string;
  };
  tier_selected: string;
  reason: string;
  ml_signals: {
    mastery_prob: number;
    retention_score: number;
    risk_score: number;
    neural_ranker_active: boolean;
  };
}

interface MLContext {
  mastery_prob: number;
  retention_score: number;
  ability_theta: number;
  risk_score: number;
  evidence_count: number;
}

interface AdaptiveVideoPlayerProps {
  topic: string;
  skillId: string;
  mlContext: MLContext;
  onMasteryUpdate?: (newMastery: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier badge colours
// ─────────────────────────────────────────────────────────────────────────────

const TIER_STYLES: Record<string, string> = {
  beginner:
    "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  intermediate:
    "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  advanced:
    "bg-purple-500/20 text-purple-300 border border-purple-500/30",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AdaptiveVideoPlayer({
  topic,
  skillId,
  mlContext,
  onMasteryUpdate,
}: AdaptiveVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selection, setSelection] = useState<PlaylistSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchPct, setWatchPct] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<boolean | null>(null);
  const [eventSent, setEventSent] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [updatedMastery, setUpdatedMastery] = useState<number | null>(null);
  const watchInterval = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch playlist selection from backend ──────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setError(null);
    setWatchPct(0);
    setQuizAnswered(null);
    setEventSent(false);
    setUpdatedMastery(null);

    fetch("/api/ml/playlist/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, ...mlContext }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSelection(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load adaptive video recommendation.");
        setLoading(false);
      });
  }, [topic, skillId]);

  // ── Simulate watch progress (replace with YouTube IFrame API in production) ─

  useEffect(() => {
    if (!selection?.primary_video.video_id || eventSent) return;

    watchInterval.current = setInterval(() => {
      setWatchPct((prev) => {
        const next = Math.min(100, prev + 2); // Simulates 2%/tick
        if (next >= 80 && !eventSent) {
          sendWatchEvent(next, null);
        }
        return next;
      });
    }, 3000);

    return () => {
      if (watchInterval.current) clearInterval(watchInterval.current);
    };
  }, [selection, eventSent]);

  // ── Report watch event to backend → BKT update ───────────────────────────

  async function sendWatchEvent(
    pct: number,
    quizCorrect: boolean | null
  ) {
    if (eventSent || !selection) return;
    setEventSent(true);

    try {
      const res = await fetch("/api/ml/playlist/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill_id: skillId,
          video_id: selection.primary_video.video_id,
          current_mastery: mlContext.mastery_prob,
          watch_percentage: pct,
          quiz_correct: quizCorrect,
        }),
      });
      const data = await res.json();
      if (data.bkt_update_applied) {
        setUpdatedMastery(data.updated_mastery);
        onMasteryUpdate?.(data.updated_mastery);
      }
    } catch {
      // Silently fail — don't block the UI
    }
  }

  function handleQuizAnswer(correct: boolean) {
    setQuizAnswered(correct);
    sendWatchEvent(watchPct, correct);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
        <p className="text-white/40 text-sm">Selecting your personalised video...</p>
      </div>
    );
  }

  if (error || !selection) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl bg-red-500/10 border border-red-500/20">
        <p className="text-red-400 text-sm">{error ?? "No video available."}</p>
      </div>
    );
  }

  const vid = selection.primary_video;
  const tierStyle = TIER_STYLES[vid.tier] ?? TIER_STYLES.beginner;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Video Embed ── */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
        <iframe
          ref={iframeRef}
          src={`${vid.embed_url}?rel=0&modestbranding=1&enablejsapi=1`}
          title={vid.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full aspect-video"
        />

        {/* Watch progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${watchPct}%` }}
          />
        </div>
      </div>

      {/* ── Video Metadata ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tierStyle}`}>
              {vid.tier.toUpperCase()}
            </span>
            <span className="text-white/50 text-xs">{vid.channel}</span>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-white/50 text-xs">{vid.duration_mins} min</span>
          </div>
          <h3 className="text-white font-semibold text-sm leading-snug">{vid.title}</h3>
        </div>

        {/* Explainability toggle */}
        <button
          onClick={() => setShowExplain((v) => !v)}
          className="shrink-0 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 transition"
        >
          {showExplain ? "Hide" : "Why this video?"}
        </button>
      </div>

      {/* ── Explainability Panel ── */}
      {showExplain && (
        <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4 flex flex-col gap-3 text-sm">
          <p className="text-violet-200">{selection.reason}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
            {[
              { label: "Mastery", value: `${(selection.ml_signals.mastery_prob * 100).toFixed(0)}%` },
              { label: "Retention", value: `${(selection.ml_signals.retention_score * 100).toFixed(0)}%` },
              { label: "Risk Score", value: `${selection.ml_signals.risk_score.toFixed(0)}%` },
              { label: "AI Ranker", value: selection.ml_signals.neural_ranker_active ? "ON" : "OFF" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg bg-white/5 border border-white/10 p-2 text-center"
              >
                <div className="text-white/40 text-[10px] uppercase tracking-wider">{label}</div>
                <div className="text-white font-bold text-sm mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Post-video Mini Quiz ── */}
      {watchPct >= 40 && quizAnswered === null && !eventSent && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3">
          <p className="text-white/70 text-sm font-medium">
            Quick check — did you understand the key concept from this video?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuizAnswer(true)}
              className="flex-1 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm font-semibold border border-emerald-500/30 transition"
            >
              Yes, got it
            </button>
            <button
              onClick={() => handleQuizAnswer(false)}
              className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold border border-red-500/20 transition"
            >
              Not yet
            </button>
          </div>
        </div>
      )}

      {/* ── Mastery Update Feedback ── */}
      {updatedMastery !== null && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-3 text-sm">
          <span className="text-emerald-400 text-xl">✓</span>
          <div>
            <span className="text-emerald-300 font-semibold">Mastery updated: </span>
            <span className="text-white/70">
              {(mlContext.mastery_prob * 100).toFixed(0)}% →{" "}
              <span className="text-emerald-300 font-bold">
                {(updatedMastery * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        </div>
      )}

      {/* ── Fallback option ── */}
      {selection.fallback_video && (
        <div className="text-center">
          <span className="text-white/30 text-xs">Need a different angle? </span>
          <a
            href={selection.fallback_video.embed_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 transition"
          >
            Try the {selection.fallback_video.tier} version →
          </a>
        </div>
      )}
    </div>
  );
}
