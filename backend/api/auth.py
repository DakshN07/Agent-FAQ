from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import secrets

from ..database import get_db
from ..models import Organization, User
from ..services.auth_service import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterOrgRequest(BaseModel):
    org_name: str
    admin_name: str
    admin_email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    org_id: int
    role: str

class RegisterMemberRequest(BaseModel):
    email: str
    password: str
    invite_code: str

@router.post("/register/org", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_organization(req: RegisterOrgRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == req.admin_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 1. Create Organization
    invite_code = secrets.token_hex(4).upper()
    org = Organization(name=req.org_name, invite_code=invite_code)
    db.add(org)
    db.commit()
    db.refresh(org)

    # 2. Create Admin User
    hashed_password = get_password_hash(req.password)
    user = User(
        org_id=org.id,
        email=req.admin_email,
        hashed_password=hashed_password,
        role="admin"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 3. Generate high-speed JWT
    access_token = create_access_token(data={"sub": str(user.id), "org": str(org.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "org_id": org.id,
        "role": user.role
    }

@router.post("/register/member", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_member(req: RegisterMemberRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    org = db.query(Organization).filter(Organization.invite_code == req.invite_code).first()
    if not org:
        raise HTTPException(status_code=400, detail="Invalid invite code")

    hashed_password = get_password_hash(req.password)
    user = User(
        org_id=org.id,
        email=req.email,
        hashed_password=hashed_password,
        role="member"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id), "org": str(org.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "org_id": org.id,
        "role": user.role
    }

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate high-speed JWT
    access_token = create_access_token(data={"sub": str(user.id), "org": str(user.org_id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "org_id": user.org_id,
        "role": user.role
    }
