export const mockCourseData = {
  title: "Introduction to AI with LangChain",
  description: "Master AI agent development using LangChain and LangGraph.",
  modules: [
    {
      id: "mod-1",
      title: "Module 1: Foundations",
      lessons: [
        { id: "les-1", title: "What is LangChain?", type: "video" },
        { id: "les-2", title: "LLMs vs Chat Models", type: "text" },
        { id: "test-1", title: "Module 1 Quiz", type: "test" },
      ]
    },
    {
      id: "mod-2",
      title: "Module 2: LangGraph Basics",
      lessons: [
        { id: "les-3", title: "State and Nodes", type: "video" },
        { id: "test-2", title: "State Management Test", type: "test" },
      ]
    }
  ],
  content: {
    "les-1": {
      videos: {
        en: "https://www.youtube.com/embed/jNQXAC9IVRw",
        es: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      markdown: `
### Understanding LangChain
LangChain is a framework for developing applications powered by large language models (LLMs).

#### Key Components:
1. **Models**: Interfaces to different LLMs.
2. **Prompts**: Template management.
3. **Memory**: State between calls.
      `,
      xp: 50
    }
  }
};
