from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "Agent-FAQ Enterprise Assistant"}

@router.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    from ..models import Document
    docs = db.query(Document).limit(10).all()
    return {"documents": docs}

from pydantic import BaseModel
class ChatRequest(BaseModel):
    query: str

@router.post("/chat")
def chat_with_agent(req: ChatRequest):
    from ..agents.graph import app as graph_app
    from langchain_core.messages import HumanMessage
    
    state = {
        "messages": [HumanMessage(content=req.query)],
        "current_intent": None,
        "retrieved_documents": [],
        "verification_score": None,
        "final_answer": None,
        "citations": [],
        "tool_calls": []
    }
    
    result = graph_app.invoke(state)
    
    return {
        "answer": result.get("final_answer"),
        "intent": result.get("current_intent"),
        "citations": result.get("citations", []),
        "verification_score": result.get("verification_score")
    }
