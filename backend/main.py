from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from .api.routes import router as api_router
from .api.rag_routes import router as rag_router
from .api.metrics_routes import router as metrics_router
from .database import engine, Base
from .middleware.monitoring import LatencyMonitoringMiddleware

# We will handle schema creation properly with Alembic, but for now we create tables directly
# Important: vector extension needs to be enabled in Postgres.
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Multi-Agent Enterprise Knowledge Assistant",
    description="FastAPI backend with LangGraph for enterprise knowledge management.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LatencyMonitoringMiddleware)

app.include_router(api_router, prefix="/api")
app.include_router(rag_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
