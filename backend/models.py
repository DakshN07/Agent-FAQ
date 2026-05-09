from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
import datetime
from .database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    embedding = Column(Vector(1536)) # OpenAI ada-002 size
    metadata_json = Column(Text, nullable=True) # JSON string for flexibility
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
