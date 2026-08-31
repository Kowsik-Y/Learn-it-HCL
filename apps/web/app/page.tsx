'use client';

import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CalendarCheck,
  ClipboardCheck,
  Flame,
  Lightbulb,
  Map as MapIcon,
  Search,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ──────────────────────────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 ${
          scrolled ? 'bg-background/90 backdrop-blur-xl border-b border-border' : 'bg-transparent'
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-lg font-extrabold text-foreground">Learn-it HCL</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/request-access">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-150 h-150 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-100 h-100 rounded-full bg-accent/8 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <Badge variant="secondary" className="mb-8 gap-1.5 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered adaptive learning
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold   leading-[1.1] mb-6">
            Learn exactly what <span className="text-primary">you need</span>
            ,
            <br />
            not everything else.
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            An intelligent platform that understands your goals, identifies skill gaps, builds
            personalized learning paths, and adapts as you grow.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/request-access">
              <Button size="lg" className="gap-2">
                Request Access <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Five questions, answered continuously
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
          The platform always knows where you are, where you&apos;re going, and what to do next.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Target,
              title: 'Where am I?',
              desc: 'Real-time mastery tracking across all your skills with evidence-based scoring.',
            },
            {
              icon: MapIcon,
              title: 'Where am I going?',
              desc: 'Clear goals mapped to career paths, competencies, and measurable milestones.',
            },
            {
              icon: Search,
              title: 'What am I missing?',
              desc: 'AI-powered skill gap analysis that identifies exactly what you need to learn.',
            },
            {
              icon: Zap,
              title: 'What should I do now?',
              desc: 'One clear next action — the best learning activity for this moment.',
            },
            {
              icon: Lightbulb,
              title: 'Why this?',
              desc: 'Transparent explanations for every recommendation with full evidence.',
            },
          ].map((item, _i) => (
            <Card
              key={item.title}
              className="group hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Built for real learning</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { icon: Bot, title: 'AI Tutor', desc: 'Scaffolded learning assistant' },
            { icon: Brain, title: 'Adaptive Diagnostics', desc: 'Skip what you know' },
            { icon: BarChart3, title: 'Mastery Tracking', desc: 'Evidence-based measurement' },
            { icon: Flame, title: 'Streaks & XP', desc: 'Rewards for real learning' },
            { icon: MapIcon, title: 'Learning Paths', desc: 'Prerequisite-aware DAGs' },
            { icon: CalendarCheck, title: 'Daily Missions', desc: 'Personalized sessions' },
            { icon: ClipboardCheck, title: 'Smart Assessments', desc: 'Adaptive questions' },
            { icon: Trophy, title: 'Career Goals', desc: 'Real career competencies' },
          ].map((item) => (
            <Card key={item.title} className="hover:border-primary/20 transition-all">
              <CardContent className="pt-5 pb-4">
                <item.icon className="h-6 w-6 text-primary/70 mb-3" />
                <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────── */}
      <section className="py-24 px-6">
        <Card className="max-w-2xl mx-auto bg-linear-to-br from-primary/5 to-accent/5 border-primary/10">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Stop learning everything.
              <br />
              Start learning what matters.
            </h2>
            <p className="text-muted-foreground mb-8">
              Tell the AI your goal. It handles the rest.
            </p>
            <Link href="/request-access">
              <Button size="lg" className="gap-2">
                Request Access <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* ── Footer ──────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-border text-center text-sm text-muted-foreground">
        © 2026 Learn-it HCL. AI-Powered Personalized Learning Platform.
      </footer>
    </div>
  );
}
