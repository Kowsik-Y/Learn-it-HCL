"""AI Assistant Module — Router for tutor, onboarding, and recommendations."""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser
from app.modules.ai_assistant.service import AIService

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class TutorChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: Optional[dict] = None


class OnboardingChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/tutor/chat")
async def tutor_chat(
    data: TutorChatRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Chat with the AI tutor. Uses educational scaffolding."""
    service = AIService()
    messages = [{"role": m.role, "content": m.content} for m in data.messages]

    response = await service.tutor_chat(
        messages=messages,
        learner_context=data.context,
    )

    return {
        "message": {
            "role": "assistant",
            "content": response,
        }
    }


@router.post("/onboarding/chat")
async def onboarding_chat(
    data: OnboardingChatRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """AI-guided onboarding conversation. Returns follow-up or extracted data."""
    service = AIService()
    messages = [{"role": m.role, "content": m.content} for m in data.messages]

    # If conversation is long enough, try to extract structured data
    if len(messages) >= 4:
        extracted = await service.extract_onboarding_data(messages)
        return {
            "type": "extraction",
            "data": extracted,
            "message": {
                "role": "assistant",
                "content": "Great! Based on our conversation, here's what I understand about your learning goals. Let me know if anything needs correction.",
            },
        }

    # Otherwise, continue the conversation
    system_prompt = """You are a friendly AI onboarding assistant for a learning platform.
Ask thoughtful follow-up questions to understand the learner's:
- Primary goal (career, academic, personal)
- Current experience and skills
- Target timeline
- Available study time per week
- Preferred learning format (videos, reading, projects, etc.)
- Specific interests or constraints

Ask only ONE or TWO questions at a time. Be conversational and encouraging.
Do NOT force users through a giant form."""

    full_messages = [{"role": "system", "content": system_prompt}] + messages
    response = await service.provider.chat(messages=full_messages, temperature=0.8)

    return {
        "type": "conversation",
        "message": {
            "role": "assistant",
            "content": response,
        },
    }


@router.post("/explain-recommendation")
async def explain_recommendation(
    current_user: CurrentUser,
):
    """Explain why a specific resource was recommended (or not)."""
    # This is handled by the recommendation engine's explanation generator
    # The AI assistant can provide a natural-language version
    return {
        "message": "Recommendation explanations come from the recommendation engine's evidence system, not from AI generation. See the 'reasons' field in any recommendation response."
    }
