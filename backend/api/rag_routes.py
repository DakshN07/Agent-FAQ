from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.rag_service import process_and_store_document, similarity_search

router = APIRouter(prefix="/rag", tags=["rag"])

@router.post("/upload")
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not (file.filename.endswith(".pdf") or file.filename.endswith(".txt") or file.filename.endswith(".md")):
        raise HTTPException(status_code=400, detail="Only PDF, TXT, and MD files are supported")
    
    return process_and_store_document(db, file)

@router.get("/search")
def search_documents(query: str, top_k: int = 5, db: Session = Depends(get_db)):
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    results = similarity_search(db, query, top_k)
    return {"results": results}
