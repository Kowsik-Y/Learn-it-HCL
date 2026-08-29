from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.modules.ai_course_agent.agent import course_agent_graph

router = APIRouter()

class GenerateCourseRequest(BaseModel):
    topic: str
    target_audience: str
    language: str

class GenerateCourseResponse(BaseModel):
    roadmap: dict
    materials: List[dict]
    tests: List[dict]
    videos: List[dict]

@router.post("/generate", response_model=GenerateCourseResponse)
async def generate_course(request: GenerateCourseRequest):
    initial_state = {
        "topic": request.topic,
        "target_audience": request.target_audience,
        "language": request.language,
        "roadmap": None,
        "materials": [],
        "tests": [],
        "videos": [],
        "messages": []
    }
    
    try:
        # Run the LangGraph agent
        final_state = course_agent_graph.invoke(initial_state)
        
        return GenerateCourseResponse(
            roadmap=final_state.get("roadmap", {}),
            materials=final_state.get("materials", []),
            tests=final_state.get("tests", []),
            videos=final_state.get("videos", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
