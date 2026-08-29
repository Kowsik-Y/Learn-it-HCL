from typing import TypedDict, Annotated, Sequence
import operator
import json
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage

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
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
    prompt = f"""
    Create a comprehensive course roadmap for the topic: {state['topic']}.
    Target Audience: {state['target_audience']}.
    Output format MUST be a JSON object with a 'title', 'description', and a list of 'modules'.
    Each module should have a 'title' and a list of 'lessons'.
    """
    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        content = response.content.replace("```json", "").replace("```", "").strip()
        roadmap = json.loads(content)
    except Exception:
        roadmap = {"title": state['topic'], "modules": []}
    
    return {"roadmap": roadmap}

def generate_materials(state: AgentState) -> dict:
    if not state.get("roadmap"):
        return {"materials": []}
        
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)
    materials = []
    
    prompt = f"""
    Write an introductory material for the course: {state['roadmap'].get('title')}
    Target Language: {state['language']}
    """
    response = llm.invoke([HumanMessage(content=prompt)])
    materials.append({
        "title": "Introduction",
        "content": response.content,
        "language": state['language']
    })
    
    return {"materials": materials}

def generate_tests(state: AgentState) -> dict:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)
    prompt = f"""
    Generate 3 multiple choice questions for the topic: {state['topic']}.
    Target Language: {state['language']}.
    Format as JSON list of objects with 'question', 'options' (list), and 'correct_answer'.
    """
    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        content = response.content.replace("```json", "").replace("```", "").strip()
        tests = json.loads(content)
    except Exception:
        tests = []
    return {"tests": tests}

def fetch_videos(state: AgentState) -> dict:
    topic = state['topic']
    lang = state['language']
    videos = [
        {"title": f"Learn {topic} in {lang} - Part 1", "url": f"https://youtube.com/results?search_query={topic}+{lang}"}
    ]
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
