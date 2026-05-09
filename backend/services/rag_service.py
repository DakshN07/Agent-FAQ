import os
import tempfile
import json
from fastapi import UploadFile
from sqlalchemy.orm import Session
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from ..models import Document

# You should set OPENAI_API_KEY in your environment variables
embeddings = OpenAIEmbeddings()

def process_and_store_document(db: Session, file: UploadFile):
    # Create a temporary file to save the uploaded content
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as temp_file:
        temp_file.write(file.file.read())
        temp_file_path = temp_file.name

    try:
        # Load document
        if file.filename.endswith(".pdf"):
            loader = PyPDFLoader(temp_file_path)
        else:
            loader = TextLoader(temp_file_path)
            
        docs = loader.load()

        # Chunk the document
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(docs)

        # Generate embeddings and store in DB
        for chunk in chunks:
            # We embed the chunk page content
            embedding_vector = embeddings.embed_query(chunk.page_content)
            
            db_doc = Document(
                title=file.filename,
                content=chunk.page_content,
                embedding=embedding_vector,
                metadata_json=json.dumps(chunk.metadata)
            )
            db.add(db_doc)
        
        db.commit()
        return {"message": f"Successfully processed and stored {len(chunks)} chunks from {file.filename}"}
    finally:
        os.remove(temp_file_path)

def similarity_search(db: Session, query: str, top_k: int = 5):
    query_embedding = embeddings.embed_query(query)
    
    # pgvector syntax for cosine distance: <=>.
    # Order by cosine distance ascending.
    results = db.query(Document).order_by(Document.embedding.cosine_distance(query_embedding)).limit(top_k).all()
    
    return [
        {
            "id": r.id,
            "title": r.title,
            "content": r.content,
            "metadata": json.loads(r.metadata_json) if r.metadata_json else {}
        }
        for r in results
    ]
