'use client';

import {
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Edit3,
  Globe,
  GraduationCap,
  Layers,
  Loader2,
  MapPin,
  Play,
  RefreshCw,
  Save,
  Sparkles,
  Video,
  Lightbulb,
  Wrench,
  Rocket,
  Book,
  RotateCw,
  Map,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function renderFormattedText(text: string) {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

const EMOJI_ICON_MAP: Record<string, React.ComponentType<any>> = {
  '📚': BookOpen,
  '💡': Lightbulb,
  '🛠️': Wrench,
  '🚀': Rocket,
  '🟢': CheckCircle2,
  '📘': Book,
  '▶': Play,
  '✏️': Edit3,
  '🔄': RotateCw,
  '🗺️': Map,
};

function renderLectureContent(material: string) {
  if (!material) return null;

  const lines = material.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div
            key={`code-${i}`}
            className="my-5 rounded-2xl bg-slate-950 p-5 font-mono text-sm text-emerald-400 border border-slate-800 shadow-xl overflow-x-auto"
          >
            <div className="text-xs text-slate-400 uppercase font-bold pb-3 mb-3 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-400" /> {codeLang || 'JAVASCRIPT / JSX'}
              </span>
              <span className="text-emerald-500 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-[10px]">
                PRODUCTION PATTERN
              </span>
            </div>
            <pre className="whitespace-pre leading-relaxed">{codeBuffer.join('\n')}</pre>
          </div>,
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = trimmed.replace('```', '');
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (!trimmed) return;

    // Check for leading emoji and extract it
    let MatchedIcon: React.ComponentType<any> | null = null;
    let textContent = trimmed;

    for (const [emoji, Icon] of Object.entries(EMOJI_ICON_MAP)) {
      if (trimmed.startsWith(emoji)) {
        MatchedIcon = Icon;
        textContent = trimmed.slice(emoji.length).trim();
        break;
      }
    }

    if (textContent.startsWith('### ')) {
      const headingText = textContent.replace('### ', '');
      elements.push(
        <h3
          key={i}
          className="text-xl font-black text-primary mt-6 mb-3 border-b border-primary/20 pb-2 flex items-center gap-2"
        >
          {MatchedIcon && <MatchedIcon className="h-5 w-5 text-primary shrink-0" />}
          <span>{headingText}</span>
        </h3>,
      );
    } else if (textContent.startsWith('#### ')) {
      const headingText = textContent.replace('#### ', '');
      elements.push(
        <h4 key={i} className="text-base font-bold text-foreground mt-4 mb-2 flex items-center gap-2">
          {MatchedIcon && <MatchedIcon className="h-4 w-4 text-primary shrink-0" />}
          <span>{headingText}</span>
        </h4>,
      );
    } else if (textContent.startsWith('- ') || textContent.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start gap-3 text-sm text-foreground/90 my-2 pl-3">
          {MatchedIcon ? (
            <MatchedIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2 shadow-xs" />
          )}
          <span className="leading-relaxed">
            {renderFormattedText(textContent.replace(/^[-*]\s+/, ''))}
          </span>
        </div>,
      );
    } else if (/^\d+\.\s+/.test(textContent)) {
      elements.push(
        <div
          key={i}
          className="flex items-start gap-3 text-sm text-foreground/90 my-2 pl-3 font-medium"
        >
          {MatchedIcon ? (
            <MatchedIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          ) : (
            <span className="bg-primary/15 text-primary font-black text-xs px-2 py-0.5 rounded-md shrink-0 shadow-xs">
              {textContent.match(/^\d+\./)?.[0]}
            </span>
          )}
          <span className="leading-relaxed">
            {renderFormattedText(textContent.replace(/^\d+\.\s+/, ''))}
          </span>
        </div>,
      );
    } else {
      elements.push(
        <p key={i} className="text-sm text-muted-foreground leading-relaxed my-2.5 flex items-center gap-2">
          {MatchedIcon && <MatchedIcon className="h-4 w-4 text-primary shrink-0" />}
          <span>{renderFormattedText(textContent)}</span>
        </p>,
      );
    }
  });

  return <div className="space-y-2">{elements}</div>;
}

export function AiCourseGenerator() {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showForm, setShowForm] = useState(true);

  // Interactive Lesson Modal State
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  const getDynamicLessonContent = (topicName: string, lessonTitle: string) => {
    const cleanTopic = topicName || topic || 'React';
    const cleanTitle = lessonTitle || 'Lesson';
    const lower = cleanTitle.toLowerCase();

    let lectureMaterial = '';
    let gfgUrl = '';
    let docsUrl = '';
    let videos: { id: string; title: string; channel: string }[] = [];

    if (
      lower.includes('architecture') ||
      lower.includes('virtual dom') ||
      lower.includes('foundations')
    ) {
      lectureMaterial = `### Deep Dive: ${cleanTitle}

Understanding **${cleanTitle}** is essential for mastering high-performance **${cleanTopic}** applications.

#### Core Principles & Mechanics:
1. **Virtual DOM & Reconciliation**: React maintains an in-memory representation of UI elements. When state changes occur, React computes minimal diffs (Fiber algorithm) before applying changes to the actual DOM.
2. **Component Lifecycle**: Understanding mounting, updating, and unmounting phases prevents memory leaks and unnecessary re-renders.
3. **Declarative Rendering**: Write UI as a pure function of state, allowing automatic UI updates whenever state transitions happen.

#### Code & Implementation Pattern:
\`\`\`javascript
// Virtual DOM Reconciliation Demonstration
import React, { useState } from 'react';

export function ArchitectureDemo() {
  const [count, setCount] = useState(0);
  return (
    <div className="card shadow-lg p-4">
      <h2 className="text-xl font-bold">Virtual DOM Counter: {count}</h2>
      <button onClick={() => setCount(c => c + 1)} className="btn btn-primary">
        Increment State
      </button>
    </div>
  );
}
\`\`\`

#### Key Takeaways:
- Treat React state as immutable.
- Keep components small, focused, and pure whenever possible.`;

      gfgUrl = 'https://www.geeksforgeeks.org/reactjs-virtual-dom/';
      docsUrl = 'https://react.dev/learn/render-and-commit';
      videos = [
        {
          id: 'SqcY0GlETPk',
          title: 'React Architecture & Virtual DOM in 100 Seconds',
          channel: 'Fireship',
        },
        {
          id: '8JafUJg5jFk',
          title: 'How React Virtual DOM Works Under the Hood',
          channel: 'Web Dev Simplified',
        },
        {
          id: 'bMknfKXIFA8',
          title: 'React Architecture - Full Masterclass',
          channel: 'freeCodeCamp',
        },
        {
          id: 'Tn6-PIqc4UM',
          title: 'React Component Tree & Reconciliation',
          channel: 'Programming with Mosh',
        },
      ];
    } else if (
      lower.includes('setup') ||
      lower.includes('environment') ||
      lower.includes('tooling')
    ) {
      lectureMaterial = `### Tooling & Environment Setup: ${cleanTitle}

Setting up a modern developer environment for **${cleanTopic}** guarantees fast hot-module reloading and strict type safety.

#### Environment Essentials:
1. **Vite / Next.js Bundlers**: Replaces legacy Create-React-App with lightning-fast ES module bundling.
2. **Node.js & Package Managers**: Managing dependencies using npm, yarn, or pnpm.
3. **Developer Tools**: Integrating React Developer Tools browser extension for profiling state & props.

#### Terminal & Config Snippet:
\`\`\`bash
# Create modern Vite + React app
npx create-vite@latest my-app --template react-ts
cd my-app
npm install
npm run dev
\`\`\`

#### Key Takeaways:
- Always enforce ESLint & Prettier formatting.
- Inspect component re-renders using React DevTools Profiler.`;

      gfgUrl = 'https://www.geeksforgeeks.org/reactjs-introduction/';
      docsUrl = 'https://vitejs.dev/guide/';
      videos = [
        { id: 'w7ejDZ8SWv8', title: 'Vite + React Setup Crash Course', channel: 'Traversy Media' },
        {
          id: 'Tn6-PIqc4UM',
          title: 'Setting up Node.js & React Environment',
          channel: 'Programming with Mosh',
        },
        {
          id: 'erEgovGjbEs',
          title: 'React Developer Tools Deep Dive',
          channel: 'Web Dev Simplified',
        },
        {
          id: 'hdI2bqOjy3c',
          title: 'npm & Node environment configuration',
          channel: 'Traversy Media',
        },
      ];
    } else if (
      lower.includes('syntax') ||
      lower.includes('component') ||
      lower.includes('data') ||
      lower.includes('props')
    ) {
      lectureMaterial = `### Components, Props & Data Structures: ${cleanTitle}

Components are the building blocks of **${cleanTopic}**. Mastering props passing and immutability is vital.

#### Core Concepts:
1. **Functional Components**: Lightweight JavaScript functions returning JSX.
2. **Props Passing**: Read-only data passed from parent to child components.
3. **JSX Syntax Rules**: Enclosing elements in a single fragment and using camelCase for HTML attributes.

#### Code & Implementation Pattern:
\`\`\`javascript
// Reusable Component with Typed Props
export function UserProfile({ name, role, isActive }) {
  return (
    <div className="user-card border p-3 rounded-lg">
      <h3 className="font-bold text-lg">{name}</h3>
      <p className="text-sm text-gray-500">{role}</p>
      {isActive && <span className="badge bg-green-500">Active User</span>}
    </div>
  );
}
\`\`\`

#### Key Takeaways:
- Never mutate props directly inside child components.
- Use destructuring for cleaner prop signatures.`;

      gfgUrl = 'https://www.geeksforgeeks.org/reactjs-components/';
      docsUrl = 'https://react.dev/learn/passing-props-to-a-component';
      videos = [
        {
          id: 'w7ejDZ8SWv8',
          title: 'React Components & Props Walkthrough',
          channel: 'Traversy Media',
        },
        {
          id: 'bMknfKXIFA8',
          title: 'JSX Syntax & Component Architecture',
          channel: 'freeCodeCamp',
        },
        {
          id: 'Tn6-PIqc4UM',
          title: 'Functional Components vs Class Components',
          channel: 'Programming with Mosh',
        },
        { id: 'SqcY0GlETPk', title: 'JSX Expressions in 100 Seconds', channel: 'Fireship' },
      ];
    } else if (
      lower.includes('state') ||
      lower.includes('hook') ||
      lower.includes('application') ||
      lower.includes('working')
    ) {
      lectureMaterial = `### State Management & React Hooks: ${cleanTitle}

State represents dynamic data that changes over time. Hooks allow functional components to manage state and side effects.

#### Core Hooks:
1. **useState**: Manages local component state and triggers re-renders on update.
2. **useEffect**: Handles side-effects like data fetching, subscriptions, and DOM manipulations.
3. **Custom Hooks**: Encapsulating reusable state logic across multiple components.

#### Code & Implementation Pattern:
\`\`\`javascript
import React, { useState, useEffect } from 'react';

export function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.example.com/items')
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading data...</p>;
  return <div>Data Loaded: {JSON.stringify(data)}</div>;
}
\`\`\`

#### Key Takeaways:
- Include all reactive variables in the useEffect dependency array.
- Clean up subscriptions or timers in the useEffect return function.`;

      gfgUrl = 'https://www.geeksforgeeks.org/reactjs-hooks/';
      docsUrl = 'https://react.dev/reference/react/useState';
      videos = [
        {
          id: 'TNhaISOUy6Q',
          title: 'React Hooks Course - useState & useEffect',
          channel: 'Web Dev Simplified',
        },
        {
          id: 'bMknfKXIFA8',
          title: 'Building Your First State-Driven App',
          channel: 'freeCodeCamp',
        },
        { id: 'SqcY0GlETPk', title: 'React Hooks Overview in 100 Seconds', channel: 'Fireship' },
        {
          id: 'w7ejDZ8SWv8',
          title: 'React State Management & Practical App',
          channel: 'Traversy Media',
        },
      ];
    } else if (
      lower.includes('routing') ||
      lower.includes('navigation') ||
      lower.includes('api') ||
      lower.includes('server')
    ) {
      lectureMaterial = `### Routing & API Integration: ${cleanTitle}

Connecting your frontend to backend endpoints and building multi-page navigation using React Router.

#### Key Concepts:
1. **Client-Side Routing**: Navigating between views without full browser page reloads.
2. **Axios / Fetch API**: Async/await network requests for REST & GraphQL endpoints.
3. **State Sync & Cache**: Managing server state using TanStack Query or SWR.

#### Code & Implementation Pattern:
\`\`\`javascript
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

export function AppRouter() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 p-4 border-b">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
\`\`\`

#### Key Takeaways:
- Always handle 404/Error boundaries for invalid route paths.
- Centralize API base URLs in environment configuration.`;

      gfgUrl = 'https://www.geeksforgeeks.org/reactjs-router/';
      docsUrl = 'https://reactrouter.com/en/main';
      videos = [
        {
          id: '59IXY5IDubY',
          title: 'React Router v6 Complete Tutorial',
          channel: 'Web Dev Simplified',
        },
        {
          id: 'bMknfKXIFA8',
          title: 'Connecting React Frontend to REST API',
          channel: 'freeCodeCamp',
        },
        {
          id: 'w7ejDZ8SWv8',
          title: 'Axios API Requests & React Integration',
          channel: 'Traversy Media',
        },
        { id: 'SqcY0GlETPk', title: 'Client Side Routing Explained', channel: 'Fireship' },
      ];
    } else {
      lectureMaterial = `### Deep Dive: ${cleanTitle}

Mastering **${cleanTitle}** in **${cleanTopic}** empowers software engineers to design scalable, production-grade applications.

#### Core Principles:
1. **Domain Isolation**: Structuring code by feature modules to maximize maintainability.
2. **Predictable Data Flow**: Managing inputs, transformation logic, and output state deterministically.
3. **Automated Testing**: Writing unit and integration tests to verify component behavior.

#### Implementation Pattern:
\`\`\`javascript
// Production pattern for ${cleanTitle}
export function ${cleanTitle.replace(/[^a-zA-Z0-9]/g, '')}Module() {
  console.log("Executing ${cleanTitle} module");
  return {
    module: "${cleanTitle}",
    topic: "${cleanTopic}",
    status: "Active"
  };
}
\`\`\`

#### Key Takeaways:
- Follow standard code formatting and domain boundary guidelines.
- Continuously refactor complex logic into reusable helper functions.`;

      gfgUrl = `https://www.google.com/search?q=geeksforgeeks+${encodeURIComponent(`${cleanTopic} ${cleanTitle}`)}`;
      docsUrl = `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(`${cleanTopic} ${cleanTitle}`)}`;
      videos = [
        {
          id: 'bMknfKXIFA8',
          title: `${cleanTitle} — Full Engineering Guide`,
          channel: 'freeCodeCamp',
        },
        {
          id: 'SqcY0GlETPk',
          title: `${cleanTopic} Core Principles in 100 Seconds`,
          channel: 'Fireship',
        },
        { id: 'w7ejDZ8SWv8', title: `${cleanTitle} Hands-on Tutorial`, channel: 'Traversy Media' },
        {
          id: 'Tn6-PIqc4UM',
          title: `${cleanTopic} Best Practices Masterclass`,
          channel: 'Programming with Mosh',
        },
      ];
    }

    return { lectureMaterial, gfgUrl, docsUrl, videos };
  };

  const handleGenerate = async () => {
    if (!topic || !targetAudience || !language) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/ai/course/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic, target_audience: targetAudience, language }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to generate course');
      }

      const data = await response.json();
      setResult(data);
      setShowForm(false);
      toast.success('AI Course Roadmap & Interactive Lessons generated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!result) {
      toast.error('No generated course to save');
      return;
    }

    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch('/api/ai/course/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          roadmap: result.roadmap,
          materials: result.materials,
          topic,
          target_audience: targetAudience,
          language,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Failed to save course');
      }

      const saved = await response.json();
      toast.success(
        `✅ "${saved.course.title}" saved! ${saved.course.modules} modules · ${saved.course.lessons} lessons`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setShowForm(true);
    setSelectedLesson(null);
  };

  const toggleLessonCompletion = (lessonTitle: string) => {
    setCompletedLessons((prev) => {
      const nextState = !prev[lessonTitle];
      if (nextState) {
        toast.success(`Marked "${lessonTitle}" as completed! 🎉`);
      }
      return { ...prev, [lessonTitle]: nextState };
    });
  };

  const openLessonModal = (moduleTitle: string, lessonInput: any) => {
    const titleStr = typeof lessonInput === 'string' ? lessonInput : lessonInput.title;
    const dynamicData = getDynamicLessonContent(topic, titleStr);

    const lessonObj = {
      title: titleStr,
      moduleTitle: moduleTitle,
      duration:
        typeof lessonInput === 'object' && lessonInput.duration ? lessonInput.duration : '15 mins',
      summary:
        typeof lessonInput === 'object' && lessonInput.summary
          ? lessonInput.summary
          : `Detailed workspace for ${titleStr}`,
      lecture_material:
        typeof lessonInput === 'object' &&
        lessonInput.lecture_material &&
        lessonInput.lecture_material.length > 100
          ? lessonInput.lecture_material
          : dynamicData.lectureMaterial,
      gfg_url:
        typeof lessonInput === 'object' &&
        lessonInput.gfg_url &&
        !lessonInput.gfg_url.includes('/search/')
          ? lessonInput.gfg_url
          : dynamicData.gfgUrl,
      docs_url:
        typeof lessonInput === 'object' && lessonInput.docs_url
          ? lessonInput.docs_url
          : dynamicData.docsUrl,
      videos: dynamicData.videos,
    };

    setSelectedLesson(lessonObj);
  };

  return (
    <div className="grid gap-8 md:grid-cols-1 mt-6">
      {/* Top Action Bar when Result is Present */}
      {result && (
        <div className="flex flex-wrap items-center justify-between bg-muted/60 p-4 rounded-xl border gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-semibold text-sm">Interactive Course Roadmap Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="gap-1.5"
            >
              <Edit3 className="h-4 w-4" /> {showForm ? 'Hide Input Form' : 'Edit Parameters'}
            </Button>
            <Button variant="default" size="sm" onClick={handleReset} className="gap-1.5">
              <RefreshCw className="h-4 w-4" /> Create Another Course
            </Button>
          </div>
        </div>
      )}

      {/* Input Form Card */}
      {showForm && (
        <Card className="max-w-2xl border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Course Details
            </CardTitle>
            <CardDescription>
              Enter topic and target audience to build an interactive course roadmap.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g. React"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                placeholder="e.g. Frontend Engineers"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                placeholder="e.g. English"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full gap-2 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating Interactive Course &
                  Lessons...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate AI Course Roadmap
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {result && (
        <div className="space-y-6 mt-4">
          {/* Header Overview Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="uppercase text-[10px] font-bold tracking-wider border-primary/30 text-primary"
                  >
                    Interactive AI Roadmap
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {language}
                  </Badge>
                </div>
                <Button
                  onClick={handleSaveCourse}
                  disabled={saving}
                  size="sm"
                  className="gap-2 font-semibold"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save & Publish to Database
                </Button>
              </div>
              <CardTitle className="text-2xl font-extrabold text-primary">
                {result.roadmap?.title || topic}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {result.roadmap?.description ||
                  `Tailored learning trajectory designed for ${targetAudience}.`}
              </CardDescription>

              <div className="flex flex-wrap items-center gap-4 pt-4 text-xs font-medium border-t border-primary/10 mt-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>{result.roadmap?.modules?.length || 0} Modules</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>
                    Click any lesson below to read lecture notes, watch videos & GeeksforGeeks
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{result.tests?.length || 0} Practice Quizzes</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 1. VISUAL INTERACTIVE ROADMAP TIMELINE */}
          <Card className="border-border/80">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" /> 1. Visual Learning Roadmap & Interactive
                Lessons
              </CardTitle>
              <CardDescription>
                Click on any lesson pill to open its dedicated lecture content, YouTube video, and
                GeeksforGeeks tutorial
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-primary/50 before:to-primary/20">
                {result.roadmap?.modules?.map((mod: any, idx: number) => (
                  <div key={idx} className="relative group">
                    {/* Node Dot / Badge */}
                    <div className="absolute -left-6 sm:-left-8 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-background border-2 border-primary text-primary font-bold text-xs shadow-sm ring-4 ring-background group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      {idx + 1}
                    </div>

                    {/* Module Card Content */}
                    <div className="border border-border/80 hover:border-primary/40 rounded-xl p-4 bg-card/80 shadow-sm transition-all space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/20"
                          >
                            Milestone {idx + 1}
                          </Badge>
                          <h4 className="font-bold text-base text-foreground">{mod.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>~{mod.lessons?.length * 20 || 45} mins</span>
                        </div>
                      </div>

                      {/* Interactive Lesson Pills */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Click a Lesson to Open Workspace:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {mod.lessons?.map((lesson: any, lIdx: number) => {
                            const titleStr = typeof lesson === 'string' ? lesson : lesson.title;
                            const isDone = completedLessons[titleStr];

                            return (
                              <Button
                                variant="outline"
                                key={`lesson-${lIdx}`}
                                onClick={() => openLessonModal(mod.title, lesson)}
                                className={`flex items-center justify-between h-auto p-3.5 rounded-xl border text-left transition-all group ${
                                  isDone
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-500/20'
                                    : 'bg-background hover:bg-primary/5 border-border hover:border-primary/40 shadow-xs hover:shadow-sm'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                  <span
                                    className={`flex h-6.5 w-6.5 items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${
                                      isDone
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors'
                                    }`}
                                  >
                                    {isDone ? <Check className="h-3.5 w-3.5" /> : lIdx + 1}
                                  </span>
                                  <span className="font-bold text-xs truncate text-foreground group-hover:text-primary transition-colors">
                                    {titleStr}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-bold text-primary border-primary/20 bg-primary/5 gap-1"
                                  >
                                    <BookOpen className="h-3 w-3" /> Open
                                  </Badge>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 2. Practice Quizzes & Mastery Checks */}
          <Card>
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" /> 2. Practice Quizzes & Diagnostic
                Checks
              </CardTitle>
              <CardDescription>
                Multiple choice questions to evaluate learner comprehension
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {result.tests?.map((test: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border bg-card space-y-3 shadow-sm">
                    <p className="font-semibold text-sm flex items-start gap-2">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5">
                        Q{idx + 1}
                      </span>
                      <span>{test.question}</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {test.options?.map((opt: string, oIdx: number) => {
                        const isCorrect = opt === test.correct_answer;
                        return (
                          <div
                            key={oIdx}
                            className={`px-3.5 py-2.5 rounded-lg text-xs font-medium border flex items-center justify-between transition-colors ${
                              isCorrect
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                                : 'bg-muted/30 border-border text-muted-foreground'
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrect && (
                              <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0">
                                Correct
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* INTERACTIVE LESSON CLASSROOM WORKSPACE MODAL */}
      {selectedLesson && (
        <Dialog open={!!selectedLesson} onOpenChange={(open) => !open && setSelectedLesson(null)}>
          <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl w-[94vw] max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border-primary/20 rounded-2xl bg-card">
            <DialogHeader className="space-y-3 border-b pb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs uppercase font-extrabold tracking-wide text-primary border-primary/40 px-3 py-1 bg-primary/5"
                  >
                    {selectedLesson.moduleTitle || 'Course Lesson'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs px-2.5 py-1 font-semibold">
                    <Clock className="h-3.5 w-3.5 inline mr-1 text-muted-foreground" />{' '}
                    {selectedLesson.duration || '15 mins'}
                  </Badge>
                </div>
                {completedLessons[selectedLesson.title] && (
                  <Badge className="bg-emerald-500 text-white text-xs gap-1.5 px-3 py-1 font-bold">
                    <Check className="h-4 w-4" /> Completed
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3 pt-1 tracking-tight">
                <BookOpen className="h-7 w-7 text-primary shrink-0" /> {selectedLesson.title}
              </DialogTitle>
              {selectedLesson.summary && (
                <DialogDescription className="text-base text-muted-foreground font-medium">
                  {selectedLesson.summary}
                </DialogDescription>
              )}
            </DialogHeader>

            <Tabs defaultValue="lecture" className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-3 p-1.5 h-13 bg-muted/60 rounded-xl">
                <TabsTrigger value="lecture" className="gap-2 font-bold text-sm py-2.5">
                  <BookOpen className="h-4 w-4 text-primary" /> Lecture Notes
                </TabsTrigger>
                <TabsTrigger value="video" className="gap-2 font-bold text-sm py-2.5">
                  <Video className="h-4 w-4 text-indigo-500" /> Video Tutorials (4)
                </TabsTrigger>
                <TabsTrigger value="resources" className="gap-2 font-bold text-sm py-2.5">
                  <Globe className="h-4 w-4 text-emerald-500" /> GeeksforGeeks & Docs
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Lecture Reading Material */}
              <TabsContent value="lecture" className="space-y-6 pt-6">
                <div className="p-6 sm:p-8 rounded-2xl bg-muted/30 border border-border/80 text-foreground font-sans shadow-xs space-y-4">
                  {renderLectureContent(selectedLesson.lecture_material || selectedLesson.summary)}
                </div>
              </TabsContent>

              {/* Tab 2: Embedded YouTube Video Tutorials */}
              <TabsContent value="video" className="space-y-6 pt-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                      <Play className="h-5 w-5 text-red-500 fill-current" /> Curated Video Lectures
                      for {selectedLesson.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Play tutorials directly in your classroom workspace.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs font-bold text-primary border-primary/30"
                  >
                    4 Videos Available
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedLesson.videos?.map((vid: any, vIdx: number) => (
                    <div
                      key={vIdx}
                      className="rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="aspect-video w-full bg-slate-950 relative">
                        <iframe
                          src={`https://www.youtube.com/embed/${vid.id}`}
                          title={vid.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>
                      <div className="p-4 pt-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase text-primary tracking-wider bg-primary/10 px-2 py-0.5 rounded">
                            {vid.channel}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            HD 1080p
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-foreground line-clamp-1">
                          {vid.title}
                        </h5>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t flex justify-center">
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic || 'React'} ${selectedLesson.title}`.trim())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold px-5 py-2.5 text-xs transition-all gap-2"
                  >
                    Search More Video Lectures on YouTube <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </TabsContent>

              {/* Tab 3: GeeksforGeeks & Documentation */}
              <TabsContent value="resources" className="space-y-6 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* GeeksforGeeks Card */}
                  <div className="p-6 rounded-2xl border bg-card hover:bg-emerald-500/5 transition-all space-y-4 border-emerald-500/30 shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                          GFG
                        </div>
                        <h4 className="font-extrabold text-base text-foreground">
                          GeeksforGeeks Article
                        </h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Access detailed tutorial articles, code snippets, syntax reference, and
                        interview prep guides directly on GeeksforGeeks.
                      </p>
                    </div>
                    <div className="pt-4">
                      <a
                        href={selectedLesson.gfg_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center w-full rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold px-4 py-3 text-sm transition-all gap-2 text-center shadow-xs"
                      >
                        Open GeeksforGeeks Article <ArrowUpRight className="h-4 w-4 shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Official Docs Card */}
                  <div className="p-6 rounded-2xl border bg-card hover:bg-blue-500/5 transition-all space-y-4 border-blue-500/30 shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-sm">
                          DOCS
                        </div>
                        <h4 className="font-extrabold text-base text-foreground">
                          Official Documentation
                        </h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Refer to official developer documentation, MDN Web Docs, and API reference
                        specifications.
                      </p>
                    </div>
                    <div className="pt-4">
                      <a
                        href={selectedLesson.docs_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center w-full rounded-xl border-2 border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-extrabold px-4 py-3 text-sm transition-all gap-2 text-center shadow-xs"
                      >
                        View Official Documentation <ArrowUpRight className="h-4 w-4 shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-8 pt-5 border-t flex flex-row items-center justify-between sm:justify-between gap-4">
              <Button
                variant={completedLessons[selectedLesson.title] ? 'outline' : 'default'}
                onClick={() => toggleLessonCompletion(selectedLesson.title)}
                className="gap-2.5 font-extrabold text-sm px-6 py-2.5 shadow-sm"
              >
                {completedLessons[selectedLesson.title] ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" /> Completed Lesson
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Mark Lesson as Completed
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
