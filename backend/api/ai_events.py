from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from ..database import get_db
from ..models import Event

router = APIRouter(prefix="/events", tags=["Events"])

class GenerateEventRequest(BaseModel):
    prompt: str

class EventResponse(BaseModel):
    name: str
    date: str
    time: str
    venue: str
    event_type: str
    description: str
    goodies: str

@router.post("/generate", response_model=EventResponse)
def generate_event_details(req: GenerateEventRequest):
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import PromptTemplate
        from langchain_core.output_parsers import PydanticOutputParser
        
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
        parser = PydanticOutputParser(pydantic_object=EventResponse)
        
        prompt = PromptTemplate(
            template="Extract the event details from the following description.\n{format_instructions}\nDescription: {description}\n",
            input_variables=["description"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        chain = prompt | llm | parser
        
        result = chain.invoke({"description": req.prompt})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_event(event_data: EventResponse, db: Session = Depends(get_db)):
    # This would usually take org_id from the authenticated user
    # For simplicity, we just create the event
    new_event = Event(
        name=event_data.name,
        date=event_data.date,
        time=event_data.time,
        venue=event_data.venue,
        event_type=event_data.event_type,
        description=event_data.description,
        goodies=event_data.goodies
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event
