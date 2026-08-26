'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Mock data for demo (replace with API calls) ──
const MOCK_DATA = {
  user: { full_name: 'Kowsik', role: 'student' },
  gamification: {
    total_xp: 2450,
    level: { name: 'Builder', number: 3, icon: '🔨', progress: 0.63 },
    streak: { current: 7, longest: 14, is_active: true },
    badges_count: 5,
  },
  mastery: {
    summary: { total_skills: 12, mastered: 3, learning: 5, practiced: 2, not_started: 2, overall_progress: 25 },
    skills: [
      { name: 'Python Basics', score: 0.92, status: 'mastered', trend: 'stable' },
      { name: 'Data Structures', score: 0.78, status: 'practiced', trend: 'improving' },
      { name: 'SQL Fundamentals', score: 0.65, status: 'learning', trend: 'improving' },
      { name: 'REST APIs', score: 0.45, status: 'learning', trend: 'improving' },
      { name: 'React.js', score: 0.35, status: 'learning', trend: 'stable' },
      { name: 'Machine Learning', score: 0.12, status: 'learning', trend: 'improving' },
    ],
  },
  dailyMission: {
    estimated_minutes: 25,
    total_xp_available: 80,
    primary: { title: 'REST API Error Handling', type: 'lesson', minutes: 12, xp: 30, skill: 'REST APIs' },
    review: { title: 'SQL JOIN Practice', type: 'review', minutes: 8, xp: 20, skill: 'SQL Fundamentals' },
    challenge: { title: 'Build a Simple Endpoint', type: 'challenge', minutes: 5, xp: 30, skill: 'REST APIs' },
  },
  recommendations: [
    { title: 'FastAPI Request Validation', type: 'lesson', minutes: 15, confidence: 'high', reason: 'Fills gap: REST APIs', skill: 'REST APIs' },
    { title: 'DataFrame Operations Quiz', type: 'quiz', minutes: 10, confidence: 'medium', reason: 'Review due: Data Structures', skill: 'Data Structures' },
    { title: 'React useState Deep Dive', type: 'lesson', minutes: 20, confidence: 'high', reason: 'Goal-aligned: Frontend Dev', skill: 'React.js' },
  ],
  quests: [
    { title: 'Week 2 Sprint', progress: 0.6, xp: 200, tasks_done: 3, tasks_total: 5 },
    { title: 'API Master', progress: 0.3, xp: 150, tasks_done: 1, tasks_total: 4 },
  ],
  recentXP: [
    { reason: 'Completed: Python List Comprehensions', amount: 30, time: '2h ago' },
    { reason: 'Quiz: SQL Basics (85%)', amount: 25, time: '5h ago' },
    { reason: 'Daily Streak Bonus', amount: 15, time: '1d ago' },
  ],
};

type NavTab = 'home' | 'learn' | 'skills' | 'tutor' | 'profile';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [energy, setEnergy] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(true);
  const d = MOCK_DATA;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* ── Top Bar ──────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>🧠</span>
          <span style={{ fontWeight: 700, fontSize: '16px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Learn-it HCL
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Streak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="streak-icon" style={{ fontSize: '18px' }}>🔥</span>
            <span style={{ fontWeight: 700, color: 'var(--streak-fire)', fontSize: '14px' }}>{d.gamification.streak.current}</span>
          </div>
          {/* XP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px', color: 'var(--xp-gold)' }}>⭐</span>
            <span style={{ fontWeight: 600, color: 'var(--xp-gold)', fontSize: '14px' }}>{d.gamification.total_xp.toLocaleString()}</span>
          </div>
          {/* Level Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '16px',
            background: 'rgba(124,92,252,0.1)',
            border: '1px solid rgba(124,92,252,0.2)',
          }}>
            <span>{d.gamification.level.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>
              Lv.{d.gamification.level.number}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────── */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 16px 100px' }}>
        {/* Greeting */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
            {getGreeting()}, {d.user.full_name} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {d.gamification.streak.current > 0
              ? `${d.gamification.streak.current}-day streak! Keep it going.`
              : `Ready to start learning?`
            }
          </p>
        </div>

        {/* Daily Check-In */}
        {showCheckIn && !energy && (
          <div className="glass-card" style={{
            padding: '20px',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(124,92,252,0.06), rgba(0,212,170,0.04))',
          }}>
            <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
              How are you feeling today?
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { v: 'ready', l: '🔥 Ready!', mins: 30 },
                { v: 'good', l: '🙂 Good', mins: 25 },
                { v: 'okay', l: '😐 Okay', mins: 15 },
                { v: 'tired', l: '😴 Tired', mins: 5 },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => { setEnergy(opt.v); setShowCheckIn(false); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.borderColor = 'var(--border)'}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Level Progress */}
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {d.gamification.level.icon} {d.gamification.level.name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {Math.round(d.gamification.level.progress * 100)}% to Lv.{d.gamification.level.number + 1}
            </span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'var(--card-border)' }}>
            <div style={{
              height: '100%',
              borderRadius: '3px',
              width: `${d.gamification.level.progress * 100}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* ── Daily Mission ──────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Today&apos;s Mission</h2>
            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500 }}>
              {d.dailyMission.estimated_minutes} min · +{d.dailyMission.total_xp_available} XP
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[d.dailyMission.primary, d.dailyMission.review, d.dailyMission.challenge].map((task, i) => (
              <div key={i} className="glass-card" style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    background: i === 0 ? 'rgba(124,92,252,0.15)' : i === 1 ? 'rgba(59,130,246,0.15)' : 'rgba(0,212,170,0.15)',
                  }}>
                    {i === 0 ? '📚' : i === 1 ? '🔄' : '⚡'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '14px' }}>{task.title}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {task.type} · {task.minutes} min · {task.skill}
                    </p>
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'var(--xp-glow)',
                  color: 'var(--xp-gold)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  +{task.xp} XP
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Skill Mastery ──────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Your Skills</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {d.mastery.summary.mastered}/{d.mastery.summary.total_skills} mastered
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {d.mastery.skills.map((skill, i) => (
              <div key={i} style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--card)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{skill.name}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background:
                      skill.status === 'mastered' ? 'var(--success-bg)' :
                      skill.status === 'practiced' ? 'rgba(59,130,246,0.1)' :
                      'var(--warning-bg)',
                    color:
                      skill.status === 'mastered' ? 'var(--success)' :
                      skill.status === 'practiced' ? '#3b82f6' :
                      'var(--warning)',
                  }}>
                    {skill.status} {skill.trend === 'improving' ? '↑' : ''}
                  </span>
                </div>
                <div className="mastery-bar">
                  <div
                    className={`mastery-bar-fill ${skill.status === 'mastered' ? 'mastered' : skill.status === 'practiced' ? 'practiced' : 'learning'}`}
                    style={{ width: `${skill.score * 100}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.round(skill.score * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recommendations ────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Recommended For You</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {d.recommendations.map((rec, i) => (
              <div key={i} className="glass-card" style={{
                padding: '16px 20px',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{rec.title}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {rec.type} · {rec.minutes} min · {rec.skill}
                    </p>
                  </div>
                  <div style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: rec.confidence === 'high' ? 'var(--success-bg)' : 'var(--warning-bg)',
                    color: rec.confidence === 'high' ? 'var(--success)' : 'var(--warning)',
                  }}>
                    {rec.confidence}
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '8px' }}>
                  💡 {rec.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Quests ──────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Active Quests</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {d.quests.map((quest, i) => (
              <div key={i} className="glass-card" style={{ padding: '16px' }}>
                <p style={{ fontWeight: 500, fontSize: '13px', marginBottom: '8px' }}>{quest.title}</p>
                <div className="mastery-bar" style={{ marginBottom: '8px' }}>
                  <div className="mastery-bar-fill practiced" style={{ width: `${quest.progress * 100}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{quest.tasks_done}/{quest.tasks_total} tasks</span>
                  <span style={{ fontSize: '11px', color: 'var(--xp-gold)', fontWeight: 600 }}>+{quest.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent XP ──────────────────────────── */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Recent Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {d.recentXP.map((event, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--card)',
              }}>
                <div>
                  <p style={{ fontSize: '13px' }}>{event.reason}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{event.time}</p>
                </div>
                <span className="xp-badge" style={{
                  color: 'var(--xp-gold)',
                  fontWeight: 700,
                  fontSize: '14px',
                }}>
                  +{event.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Bottom Navigation ────────────────────── */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)',
        padding: '8px 0 env(safe-area-inset-bottom, 8px)',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 50,
      }}>
        {[
          { id: 'home' as NavTab, icon: '🏠', label: 'Home' },
          { id: 'learn' as NavTab, icon: '📚', label: 'Learn' },
          { id: 'skills' as NavTab, icon: '🧠', label: 'Skills' },
          { id: 'tutor' as NavTab, icon: '🤖', label: 'AI Tutor' },
          { id: 'profile' as NavTab, icon: '👤', label: 'Profile' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '4px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '10px',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
