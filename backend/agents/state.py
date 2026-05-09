from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage

class GraphState(TypedDict):
    """
    Represents the state of our multi-agent enterprise knowledge assistant.
    """
    messages: List[BaseMessage]
    current_intent: Optional[str]
    retrieved_documents: List[Dict[str, Any]]
    verification_score: Optional[float]
    final_answer: Optional[str]
    citations: List[str]
    tool_calls: List[Dict[str, Any]]
