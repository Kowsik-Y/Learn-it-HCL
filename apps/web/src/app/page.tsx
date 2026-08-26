'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: 'var(--background)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {/* ── Navigation ────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrolled ? 'rgba(10,10,15,0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🧠</span>
          <span style={{ fontWeight: 800, fontSize: '20px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Learn-it HCL
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/login" className="btn-ghost" style={{ textDecoration: 'none' }}>Sign In</Link>
          <Link href="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Get Started</Link>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gradient orb background */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            background: 'rgba(124,92,252,0.05)',
          }}>
            <span style={{ color: 'var(--accent)' }}>✨</span>
            AI-powered adaptive learning
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '24px',
            letterSpacing: '-0.02em',
          }}>
            Learn exactly what{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              you need
            </span>
            ,<br />
            not everything else.
          </h1>

          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '580px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            An intelligent platform that understands your goals, identifies skill gaps,
            builds personalized learning paths, and adapts as you grow. Powered by AI,
            driven by learning science.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 32px', fontSize: '16px' }}>
              Start Learning Free →
            </Link>
            <Link href="/dashboard" className="btn-ghost" style={{ textDecoration: 'none', padding: '14px 32px', fontSize: '16px' }}>
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>
          Five questions, answered continuously
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '64px', fontSize: '16px' }}>
          The platform always knows where you are, where you&apos;re going, and what to do next.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[
            { icon: '📍', title: 'Where am I?', desc: 'Real-time mastery tracking across all your skills with evidence-based scoring.' },
            { icon: '🎯', title: 'Where am I going?', desc: 'Clear goals mapped to career paths, competencies, and measurable milestones.' },
            { icon: '🔍', title: 'What am I missing?', desc: 'AI-powered skill gap analysis that identifies exactly what you need to learn.' },
            { icon: '⚡', title: 'What should I do now?', desc: 'One clear next action — the best learning activity for this moment.' },
            { icon: '💡', title: 'Why this?', desc: 'Transparent explanations for every recommendation with full evidence.' },
          ].map((item, i) => (
            <div key={i} className="glass-card" style={{ padding: '28px', cursor: 'default' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, marginBottom: '64px' }}>
          Built for real learning
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { icon: '🤖', title: 'AI Tutor', desc: 'Conversational learning assistant that scaffolds understanding' },
            { icon: '🧠', title: 'Adaptive Diagnostics', desc: 'Skip what you know, focus on what matters' },
            { icon: '📊', title: 'Mastery Tracking', desc: 'Evidence-based skill measurement, not just completion' },
            { icon: '🔥', title: 'Streaks & XP', desc: 'Duolingo-style motivation that rewards real learning' },
            { icon: '🗺️', title: 'Learning Paths', desc: 'Prerequisite-aware DAGs, not random course lists' },
            { icon: '🎯', title: 'Daily Missions', desc: 'Personalized 5-45 min sessions based on your time' },
            { icon: '📝', title: 'Smart Assessments', desc: 'Adaptive questions that measure understanding' },
            { icon: '🏆', title: 'Career Goals', desc: 'Map your learning to real career competencies' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div className="glass-card" style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: '48px',
          background: 'linear-gradient(135deg, rgba(124,92,252,0.08), rgba(0,212,170,0.05))',
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
            Stop learning everything.<br />Start learning what matters.
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Tell the AI your goal. It handles the rest.
          </p>
          <Link href="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 40px', fontSize: '16px' }}>
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer style={{
        padding: '40px 24px',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '13px',
      }}>
        <p>© 2026 Learn-it HCL. AI-Powered Personalized Learning Platform.</p>
      </footer>
    </div>
  );
}
