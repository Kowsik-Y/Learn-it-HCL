'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: `Hey there! 👋 Welcome to Learn-it HCL.\n\nI'm your AI learning companion. I'd love to help you create a personalized learning path.\n\nTo get started — **what's your main learning goal?** For example:\n• "I want to become a full-stack developer"\n• "I need to learn Python for data science"\n• "I want to prepare for a machine learning interview"`,
};

export default function OnboardingPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Simulated multi-step onboarding responses
  const FOLLOWUP_RESPONSES = [
    `Great choice! 🎯\n\nNow let me understand where you're starting from.\n\n**What's your current experience level with programming?**\n• Complete beginner\n• Some experience (e.g., basic Python, HTML/CSS)\n• Intermediate (built projects before)\n• Advanced (working professional)`,
    `Got it! That helps me calibrate the right starting point for you.\n\n**How much time can you dedicate to learning per week?**\n• 2-3 hours (casual pace)\n• 5-7 hours (steady pace)\n• 10+ hours (intensive pace)`,
    `Perfect. One more thing — **how do you prefer to learn?**\n\n• 📹 Video lessons (watch and learn)\n• 📖 Reading (articles and documentation)\n• 💻 Hands-on (jump into projects)\n• 🔀 Mix of everything`,
    null, // Triggers extraction
  ];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response delay
    await new Promise((r) => setTimeout(r, 1200));

    if (step < FOLLOWUP_RESPONSES.length && FOLLOWUP_RESPONSES[step]) {
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: FOLLOWUP_RESPONSES[step]!,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setStep((s) => s + 1);
    } else {
      // Extract data and show summary
      const extracted = {
        goal: messages[1]?.content || 'Learn programming',
        experience: messages[3]?.content || 'Some experience',
        hours_per_week: messages[5]?.content || '5-7 hours',
        learning_style: input,
        confidence: 'Based on your responses',
      };
      setExtractedData(extracted);

      const summaryMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `Excellent! Here's what I understand about your learning goals:\n\n🎯 **Goal:** ${extracted.goal}\n📊 **Experience:** ${extracted.experience}\n⏰ **Time commitment:** ${extracted.hours_per_week}/week\n📖 **Learning style:** ${extracted.learning_style}\n\nI'm now ready to:\n1. Run a quick **diagnostic assessment** to map your current skills\n2. Generate your **personalized learning path**\n3. Set up your **daily missions**\n\nReady to start? 🚀`,
      };
      setMessages((prev) => [...prev, summaryMsg]);
    }

    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--background)',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 600 }}>AI Onboarding</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Let&apos;s build your learning profile</p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: '4px',
        }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              width: '24px',
              height: '4px',
              borderRadius: '2px',
              background: i <= step ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              maxWidth: '85%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--primary), #9966ff)'
                : 'var(--card)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              fontSize: '14px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '12px 20px',
            borderRadius: '16px 16px 16px 4px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--text-muted)',
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input or CTA */}
      {extractedData ? (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '12px',
        }}>
          <Link href="/dashboard" className="btn-primary" style={{
            textDecoration: 'none',
            flex: 1,
            textAlign: 'center',
            padding: '14px',
            fontSize: '15px',
          }}>
            🚀 Start Learning
          </Link>
        </div>
      ) : (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '10px',
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your answer..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-primary"
            style={{ padding: '12px 20px', opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            Send
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
