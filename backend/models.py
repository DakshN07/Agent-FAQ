from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
import datetime
from .database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    invite_code = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="organization")
    events = relationship("Event", back_populates="organization")
    historical_memories = relationship("HistoricalMemory", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="member") # admin, leader, member
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="users")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    date = Column(String, nullable=True)
    time = Column(String, nullable=True)
    venue = Column(String, nullable=True)
    event_type = Column(String, nullable=True)
    goodies = Column(String, nullable=True)
    context = Column(Text, nullable=True) # Full unstructured context for RAG
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="events")
    integrations = relationship("Integration", back_populates="event")
    messages = relationship("Message", back_populates="event")

class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    platform = Column(String) # Slack, Discord, Web
    credentials_json = Column(Text) # Encrypted OAuth/Webhook details
    is_active = Column(Boolean, default=True)

    event = relationship("Event", back_populates="integrations")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    source_app = Column(String)
    source_user = Column(String)
    content = Column(Text)
    ai_draft = Column(Text, nullable=True)
    final_response = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, approved, auto-responded
    confidence_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("Event", back_populates="messages")

class HistoricalMemory(Base):
    __tablename__ = "historical_memories"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    original_query = Column(Text)
    final_response = Column(Text)
    embedding = Column(Vector(1536)) # For OpenAI embeddings
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="historical_memories")
