from .state import GraphState
from ..services.rag_service import similarity_search
from ..database import SessionLocal

def retrieval_node(state: GraphState) -> GraphState:
    messages = state.get("messages", [])
    if not messages:
        return state
    
    query = messages[-1].content
    
    # We create a short-lived session here for the node
    db = SessionLocal()
    try:
        results = similarity_search(db, query, top_k=5)
    finally:
        db.close()
        
    citations = [res["title"] for res in results]
    
    return {
        "retrieved_documents": results,
        "citations": citations
    }
