from typing import TypedDict, Annotated, Sequence
import operator
import json
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage
from app.config import get_settings

settings = get_settings()

# ── Dedicated Provider Functions ──

def get_groq_llm(temperature: float = 0.7):
    """Dedicated Groq API provider initialization."""
    if not settings.groq_api_key:
        return None
    model_name = settings.ai_default_model if settings.ai_default_model and "gpt-oss" not in settings.ai_default_model else "llama-3.3-70b-versatile"
    return ChatOpenAI(
        model=model_name,
        api_key=settings.groq_api_key,
        base_url=settings.groq_base_url,
        temperature=temperature
    )

def get_openai_llm(temperature: float = 0.7):
    """Original OpenAI path initialization."""
    if not settings.openai_api_key or settings.openai_api_key == "sk-your-openai-key-here":
        return None
    return ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.openai_api_key,
        temperature=temperature
    )

def get_llm(temperature: float = 0.7):
    """Runtime selector: detects configured provider and returns the active instance."""
    if settings.groq_api_key:
        llm = get_groq_llm(temperature)
        if llm:
            return llm
            
    if settings.openai_api_key:
        llm = get_openai_llm(temperature)
        if llm:
            return llm

    return None

class AgentState(TypedDict):
    topic: str
    target_audience: str
    language: str
    roadmap: dict | None
    materials: list[dict]
    tests: list[dict]
    videos: list[dict]
    messages: Annotated[Sequence[BaseMessage], operator.add]

def generate_roadmap(state: AgentState) -> dict:
    topic_title = state['topic'].strip()
    audience = state['target_audience'].strip()
    def make_lesson(clean_name, summary, duration="45 mins"):
        query_topic = clean_name.replace(" ", "+")
        
        # Direct GeeksforGeeks tutorial routing
        gfg_slug_map = {
            "architecture": "https://www.geeksforgeeks.org/reactjs-virtual-dom/",
            "setup": "https://www.geeksforgeeks.org/reactjs-introduction/",
            "syntax": "https://www.geeksforgeeks.org/reactjs-components/",
            "state": "https://www.geeksforgeeks.org/reactjs-hooks/",
            "lifecycle": "https://www.geeksforgeeks.org/reactjs-lifecycle-of-components/",
            "routing": "https://www.geeksforgeeks.org/reactjs-router/",
            "testing": "https://www.geeksforgeeks.org/unit-testing-in-react/"
        }
        
        gfg_link = f"https://www.google.com/search?q=site%3Ageeksforgeeks.org+{query_topic}"
        for key, url in gfg_slug_map.items():
            if key in clean_name.lower():
                gfg_link = url
                break

        return {
            "title": clean_name,
            "duration": duration,
            "summary": summary,
            "lecture_material": f"""### 📚 Lesson Overview: {clean_name}

Welcome to this in-depth guide on **{clean_name}** for **{topic_title}**!

#### 💡 Core Principles & Key Concepts:
1. **Understanding the Architecture**: {clean_name} forms the backbone of scalable software engineering in {topic_title}. By understanding component responsibility and modular patterns, you build maintainable systems.
2. **Key Mechanisms**:
   - **Modularity**: Isolating concerns into reusable units.
   - **Data Flow**: Unidirectional, predictable state updates and propagation.
   - **Performance**: Minimizing unnecessary re-renders and memory allocations.

#### 🛠️ Code & Implementation Pattern:
```javascript
// Example pattern for {clean_name}
function demonstrate{clean_name.replace(' ', '').replace('&', '').replace('-', '')}() {{
  console.log("Initializing {clean_name} with best practices...");
  return {{
    status: "active",
    topic: "{topic_title}",
    timestamp: new Date().toISOString()
  }};
}}
```

#### 🚀 Practical Developer Takeaways:
- Always structure your project files logically around domain boundaries.
- Utilize automated linting and unit tests to verify behavior before deployment.
""",
            "video_title": f"{topic_title.capitalize()} — {clean_name} Full Tutorial",
            "video_url": f"https://www.youtube.com/results?search_query={query_topic}+tutorial",
            "gfg_url": gfg_link,
            "gfg_title": f"GeeksforGeeks — {clean_name} Article & Tutorial",
            "docs_url": f"https://developer.mozilla.org/en-US/search?q={query_topic}"
        }

    # Authentic topic-specific fallback if LLM is unavailable
    fallback_roadmap = {
        "title": f"Mastering {topic_title.capitalize()}: Complete Guide",
        "description": f"Structured step-by-step learning path for {audience} to build production mastery in {topic_title}.",
        "modules": [
            {
                "title": f"1. Foundations & Ecosystem of {topic_title.capitalize()}",
                "lessons": [
                    make_lesson(f"Introduction to {topic_title.capitalize()} Architecture", f"Understand Virtual DOM, component lifecycle, and rendering concepts in {topic_title}."),
                    make_lesson("Development Environment Setup & Tooling", "Configure Node.js, Vite/Next.js, ESLint, Prettier, and essential dev tools."),
                    make_lesson("Core Syntax, Components & Data Structures", "Master JSX syntax, props passing, conditional rendering, and component composition."),
                    make_lesson("Building Your First Working Application", "Hands-on project building an interactive component-driven app from scratch.")
                ]
            },
            {
                "title": f"2. State Management & Data Flow in {topic_title.capitalize()}",
                "lessons": [
                    make_lesson("Managing Application State & Hooks", "Deep dive into useState, useReducer, and predictable state mutations."),
                    make_lesson("Component Lifecycle & Side Effects", "Master useEffect, dependency arrays, cleanup functions, and subscription handlers."),
                    make_lesson("Asynchronous Operations & API Fetching", "Fetch remote endpoints using fetch/Axios, handle loading states & error boundaries."),
                    make_lesson("Context & Centralized Store Architecture", "Share global state across component trees cleanly using React Context & Zustand.")
                ]
            },
            {
                "title": f"3. Advanced Patterns & Architecture",
                "lessons": [
                    make_lesson("Routing, Layouts & Code Splitting", "Configure dynamic routing, nested layouts, lazy loading, and code splitting."),
                    make_lesson("Form Validation & Error Handling", "Build robust user forms using React Hook Form, Zod schema validation, and error bounds."),
                    make_lesson("Custom Utilities & Higher-Order Patterns", "Extract reusable business logic into custom hooks and composition utilities."),
                    make_lesson("Performance Optimization & Memoization", "Optimize rendering pipelines using useMemo, useCallback, and React Profiler.")
                ]
            },
            {
                "title": f"4. Enterprise Testing & Production Deployment",
                "lessons": [
                    make_lesson("Unit & Integration Testing Strategies", "Write comprehensive unit tests with Vitest, React Testing Library, and Mock Service Worker."),
                    make_lesson("Security Best Practices & Auth Integration", "Implement JWT token management, XSS protection, and secure API client interceptors."),
                    make_lesson("CI/CD Pipeline Setup & Cloud Hosting", "Automate linting, testing, and deployment to Vercel, Docker containers, or AWS."),
                    make_lesson("Final Real-World Capstone Project", "Build and publish a full-featured enterprise application to complete your certification.")
                ]
            }
        ]
    }

    llm = get_llm(temperature=0.7)
    if not llm:
        return {"roadmap": fallback_roadmap}

    prompt = f"""You are an expert curriculum author.
Create a comprehensive, production-ready course roadmap for the topic: "{topic_title}".
Target Audience: {audience}.
Language: {state['language']}.

Output format MUST be strictly a JSON object with:
- "title": (string)
- "description": (string)
- "modules": (array of objects)
  Each module object must have:
  - "title": (string module title)
  - "lessons": (array of lesson objects, each containing:
      - "title": (string lesson title)
      - "duration": (string, e.g. "15 mins")
      - "summary": (string short summary)
      - "lecture_material": (string detailed 2-paragraph lecture notes with key takeaways)
      - "video_title": (string video name)
      - "video_url": (string YouTube search URL for topic)
      - "gfg_title": (string GeeksforGeeks title)
      - "gfg_url": (string GeeksforGeeks search URL for topic)
      - "docs_url": (string documentation search URL)
    )

Return ONLY valid raw JSON. Do NOT include Markdown block indicators like ```json."""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.replace("```json", "").replace("```", "").strip()
        start = content.find("{")
        end = content.rfind("}") + 1
        if start != -1 and end != 0:
            content = content[start:end]
        roadmap = json.loads(content)
        if not isinstance(roadmap, dict) or "modules" not in roadmap:
            roadmap = fallback_roadmap
    except Exception as e:
        print(f"⚠️ Error generating roadmap via LLM: {e}")
        roadmap = fallback_roadmap
    
    return {"roadmap": roadmap}

def generate_materials(state: AgentState) -> dict:
    if not state.get("roadmap"):
        return {"materials": []}
    
    topic = state['topic']
    audience = state['target_audience']
    lang = state['language']

    fallback_materials = [
        {
            "title": f"Core Foundations of {topic.capitalize()}",
            "content": f"Welcome to the comprehensive course on {topic}. Designed specifically for {audience}, this guide introduces foundational principles, core syntax, modular design, and industry best practices to get you building immediately.",
            "language": lang
        },
        {
            "title": f"Production Workflows & Best Practices",
            "content": f"When scaling {topic} in production environments, key focus areas include maintainable architecture, structured error handling, efficient state management, and seamless backend integration.",
            "language": lang
        }
    ]
        
    llm = get_llm(temperature=0.5)
    if not llm:
        return {"materials": fallback_materials}

    materials = []
    prompt = f"""Write detailed introductory learning materials for the course topic: "{topic}".
Target Audience: {audience}
Language: {lang}

Explain the fundamental principles, real-world relevance, and core concepts clearly in 2 detailed paragraphs.
"""
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        materials.append({
            "title": f"Introduction & Core Concepts of {topic.capitalize()}",
            "content": response.content,
            "language": lang
        })
    except Exception as e:
        print(f"⚠️ Error generating materials via LLM: {e}")
        materials = fallback_materials
    
    return {"materials": materials}

def generate_tests(state: AgentState) -> dict:
    topic = state['topic']
    lang = state['language']
    
    fallback_tests = [
        {
            "question": f"What is the primary objective of modular architecture in {topic}?",
            "options": [
                "Improves code reusability, maintainability, and testability",
                "Increases global dependency coupling",
                "Bypasses standard runtime execution",
                "Replaces database storage"
            ],
            "correct_answer": "Improves code reusability, maintainability, and testability"
        },
        {
            "question": f"Which concept is essential for handling asynchronous operations in {topic}?",
            "options": ["Promises & Async/Await", "Synchronous blocking loops", "Static CSS files", "Hardcoded delay timers"],
            "correct_answer": "Promises & Async/Await"
        },
        {
            "question": f"Why is automated testing critical before deploying {topic} applications?",
            "options": [
                "Catches regressions and ensures system reliability",
                "It is strictly optional and has no benefit",
                "Reduces user interface responsiveness",
                "Replaces code compilation"
            ],
            "correct_answer": "Catches regressions and ensures system reliability"
        }
    ]

    llm = get_llm(temperature=0.5)
    if not llm:
        return {"tests": fallback_tests}

    prompt = f"""Generate 3 high-quality multiple choice assessment questions for the course topic: "{topic}".
Language: {lang}.
Output format MUST be ONLY a JSON list of objects with:
- "question": string
- "options": array of 4 distinct string choices
- "correct_answer": string matching EXACTLY one of the options

Do NOT include markdown wrapping like ```json."""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.replace("```json", "").replace("```", "").strip()
        start = content.find("[")
        end = content.rfind("]") + 1
        if start != -1 and end != 0:
            content = content[start:end]
        tests = json.loads(content)
        if not isinstance(tests, list) or len(tests) == 0:
            tests = fallback_tests
    except Exception as e:
        print(f"⚠️ Error generating tests via LLM: {e}")
        tests = fallback_tests

    return {"tests": tests}

def fetch_videos(state: AgentState) -> dict:
    llm = get_llm(temperature=0.5)
    topic = state['topic']
    lang = state['language']
    
    fallback_videos = [
        {"title": f"Complete {topic.capitalize()} Full Course & Tutorial", "url": f"https://www.youtube.com/results?search_query={topic}+full+course+{lang}"},
        {"title": f"{topic.capitalize()} Hands-on Real World Projects", "url": f"https://www.youtube.com/results?search_query={topic}+hands+on+projects+{lang}"},
        {"title": f"{topic.capitalize()} Advanced Architecture & Best Practices", "url": f"https://www.youtube.com/results?search_query={topic}+advanced+best+practices"}
    ]

    if not llm:
        return {"videos": fallback_videos}

    prompt = f"""Recommend 3 highly relevant video tutorial titles for learning {topic} in {lang}.
Output format MUST be a JSON list of objects, each having a 'title' and a 'search_query'.
Do NOT include markdown formatting.
"""
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.replace("```json", "").replace("```", "").strip()
        start = content.find("[")
        end = content.rfind("]") + 1
        if start != -1 and end != 0:
            content = content[start:end]
        items = json.loads(content)
        videos = [
            {
                "title": item["title"],
                "url": f"https://www.youtube.com/results?search_query={item.get('search_query', item['title']).replace(' ', '+')}"
            }
            for item in items
        ]
    except Exception as e:
        print(f"⚠️ Error fetching video links via LLM: {e}")
        videos = fallback_videos
    return {"videos": videos}

def build_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("generate_roadmap", generate_roadmap)
    workflow.add_node("generate_materials", generate_materials)
    workflow.add_node("generate_tests", generate_tests)
    workflow.add_node("fetch_videos", fetch_videos)
    
    workflow.set_entry_point("generate_roadmap")
    
    workflow.add_edge("generate_roadmap", "generate_materials")
    workflow.add_edge("generate_materials", "generate_tests")
    workflow.add_edge("generate_tests", "fetch_videos")
    workflow.add_edge("fetch_videos", END)
    
    return workflow.compile()

course_agent_graph = build_graph()

