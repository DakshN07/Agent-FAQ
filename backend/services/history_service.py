from sqlalchemy.orm import Session
from ..models import HistoricalMemory
from langchain_openai import OpenAIEmbeddings
import os

# Initialize OpenAI Embeddings for Vectorization
embeddings_model = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY", "dummy_key"))

def vectorize_and_save_history(db: Session, org_id: int, original_query: str, final_response: str):
    """
    Vectorizes the organization's approved interaction and saves it to pgvector.
    This creates the 'Organizational Memory' that the AI Agent uses for future context.
    """
    # Combine query and response to create a rich context vector
    text_to_embed = f"Query: {original_query}\nApproved Response Tone/Style: {final_response}"
    
    # Generate 1536-dimensional vector using OpenAI
    try:
        vector = embeddings_model.embed_query(text_to_embed)
    except Exception as e:
        print(f"Failed to generate embedding: {e}")
        # In a real environment, you might fallback or queue this
        vector = [0.0] * 1536

    # Save to PostgreSQL
    memory = HistoricalMemory(
        org_id=org_id,
        original_query=original_query,
        final_response=final_response,
        embedding=vector
    )
    
    db.add(memory)
    db.commit()
    db.refresh(memory)
    
    return memory
