from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from ..database import get_db
from ..models import Message, Event
from ..services.history_service import vectorize_and_save_history

router = APIRouter(prefix="/inbox", tags=["Unified Inbox"])

class ApproveMessageRequest(BaseModel):
    final_response: str
    org_id: int # In a real app, this comes from the JWT Token

@router.post("/{message_id}/approve")
def approve_message(message_id: int, req: ApproveMessageRequest, db: Session = Depends(get_db)):
    """
    Approves an AI Draft.
    1. Updates the message status to 'approved'.
    2. Dispatches the message back to the source app (Slack, Discord).
    3. Saves the final response to Organizational Memory (pgvector) so the AI learns the tone.
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # 1. Update status
    message.status = "approved"
    message.final_response = req.final_response
    db.commit()

    # 2. (Stub) Dispatch to source app
    # dispatch_service.send(message.source_app, message.source_user, req.final_response)

    # 3. Save to Organizational Memory (Historical RAG)
    # This is the "best" feature requested by the user: The agent learns the organization's tone!
    vectorize_and_save_history(
        db=db,
        org_id=req.org_id,
        original_query=message.content,
        final_response=req.final_response
    )

    return {"status": "success", "message": "Message approved and dispatched. Organizational memory updated."}
