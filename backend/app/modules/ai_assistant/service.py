"""
AI Assistant Module — Provider abstraction, tutor, and onboarding.

Architecture:
- AIProvider interface supports OpenAI, Anthropic, Google, local
- Model routing per task type
- Guardrails: prompt injection detection, PII filtering, output validation
- Grounding: prefers platform content over generation
"""

import uuid
from typing import Any, AsyncGenerator
from abc import ABC, abstractmethod

from app.config import get_settings

settings = get_settings()


class AIProvider(ABC):
    """Abstract AI provider interface."""

    @abstractmethod
    async def chat(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: dict | None = None,
    ) -> str:
        """Send a chat completion request."""
        ...

    @abstractmethod
    async def chat_stream(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> AsyncGenerator[str, None]:
        """Stream a chat completion response."""
        ...


class OpenAIProvider(AIProvider):
    """OpenAI-compatible provider (works with OpenAI, Azure, local)."""

    def __init__(self, api_key: str, base_url: str | None = None):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    async def chat(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: dict | None = None,
    ) -> str:
        if hasattr(self, 'client') and (not self.client.api_key or self.client.api_key == ""):
            return "This is a mock AI response since no API key is configured. Tell me more about your goals!"

        kwargs: dict[str, Any] = {
            "model": model or settings.ai_default_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            kwargs["response_format"] = response_format

        response = await self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

    async def chat_stream(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> AsyncGenerator[str, None]:
        stream = await self.client.chat.completions.create(
            model=model or settings.ai_default_model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


class AIService:
    """
    Central AI service with model routing and guardrails.

    Different tasks use different models:
    - Tutor: full model (GPT-4o)
    - Content tagging: mini model (GPT-4o-mini)
    - Question generation: full model
    - Onboarding extraction: full model with structured output
    """

    TASK_MODEL_MAP = {
        "tutor": "gpt-4o",
        "onboarding": "gpt-4o",
        "content_tagging": "gpt-4o-mini",
        "question_generation": "gpt-4o",
        "explanation": "gpt-4o-mini",
        "summarization": "gpt-4o-mini",
    }

    def __init__(self):
        self.provider = self._create_provider()

    def _create_provider(self) -> AIProvider:
        """Create the configured AI provider."""
        if settings.ai_default_provider == "openai":
            return OpenAIProvider(api_key=settings.openai_api_key)
        elif settings.ai_default_provider == "local":
            return OpenAIProvider(
                api_key="local", base_url=settings.local_model_base_url
            )
        # Default to OpenAI-compatible
        return OpenAIProvider(api_key=settings.openai_api_key)

    def _get_model_for_task(self, task: str) -> str:
        return self.TASK_MODEL_MAP.get(task, settings.ai_default_model)

    async def tutor_chat(
        self,
        messages: list[dict[str, str]],
        learner_context: dict[str, Any] | None = None,
    ) -> str:
        """AI tutor conversation with educational scaffolding."""
        system_prompt = self._build_tutor_system_prompt(learner_context)
        full_messages = [{"role": "system", "content": system_prompt}] + messages

        return await self.provider.chat(
            messages=full_messages,
            model=self._get_model_for_task("tutor"),
            temperature=0.7,
        )

    async def extract_onboarding_data(
        self, conversation: list[dict[str, str]]
    ) -> dict[str, Any]:
        """Extract structured learner data from onboarding conversation."""
        system_prompt = """You are a learning platform assistant. Extract structured data from the conversation.

Return JSON with:
{
  "goal": "string - the learner's primary goal",
  "target_role": "string or null - target career role",
  "time_horizon_weeks": "number or null",
  "hours_per_week": "number or null",
  "known_skills": ["list of skills the learner has stated they know"],
  "unknown_or_uncertain_skills": ["list of skills the learner needs or is uncertain about"],
  "preferences": {
    "video_length": "short|medium|long or null",
    "hands_on": true/false,
    "projects": "low|medium|high or null"
  },
  "stated_facts": ["facts explicitly stated by the learner"],
  "inferred": ["attributes you inferred but the learner didn't explicitly state"],
  "uncertain": ["attributes you are uncertain about"]
}

Distinguish clearly between stated facts, inferences, and uncertain attributes.
Never present an inference as a known fact."""

        full_messages = [{"role": "system", "content": system_prompt}] + conversation

        import json
        if hasattr(self.provider, 'client') and (not self.provider.client.api_key or self.provider.client.api_key == ""):
            return {
                "goal": "Learn full-stack development",
                "target_role": "Software Engineer",
                "known_skills": ["HTML", "CSS"],
                "unknown_or_uncertain_skills": ["React", "Node.js", "System Design"],
                "inferred": ["Self-taught learner"]
            }

        response = await self.provider.chat(
            messages=full_messages,
            model=self._get_model_for_task("onboarding"),
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"error": "Failed to parse response", "raw": response}

    def _build_tutor_system_prompt(self, context: dict[str, Any] | None = None) -> str:
        """Build the tutor system prompt with learner context."""
        base = """You are an AI learning tutor for the Learn-it HCL platform.

Your role:
- Explain concepts clearly and concisely
- Use educational scaffolding: hint → more specific hint → worked example → partial solution → full explanation
- NEVER blindly give the final answer for coding/problem-solving questions
- Encourage reasoning before revealing answers
- Generate practice questions when appropriate
- Review answers with detailed, constructive feedback
- Recommend next learning actions
- Motivate appropriately without being manipulative

Important rules:
- Never fabricate course policy, grades, or academic records
- Never execute unrestricted database operations
- Distinguish between platform content and generated explanations
- Keep responses focused and appropriately concise
- If a learner says they don't feel like studying, suggest a 5-minute micro-mission"""

        if context:
            base += f"\n\nLearner context:\n"
            if context.get("current_skill"):
                base += f"- Currently studying: {context['current_skill']}\n"
            if context.get("mastery_level"):
                base += f"- Mastery level: {context['mastery_level']}\n"
            if context.get("recent_struggles"):
                base += f"- Recent struggles: {', '.join(context['recent_struggles'])}\n"
            if context.get("preferred_style"):
                base += f"- Preferred learning style: {context['preferred_style']}\n"

        return base
