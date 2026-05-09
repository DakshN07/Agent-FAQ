from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/metrics", tags=["metrics"])

class EvaluationMetrics(BaseModel):
    hallucination_score: float
    retrieval_accuracy: float
    average_latency: float
    token_usage_total: int

@router.get("/")
def get_metrics():
    # In a real system, these would be aggregated from Redis or Postgres logs
    # For now, we return mock metrics for the evaluation dashboard
    return EvaluationMetrics(
        hallucination_score=0.92, # Higher is better
        retrieval_accuracy=0.88,
        average_latency=1.24, # Seconds
        token_usage_total=145000
    )
