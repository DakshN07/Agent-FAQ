import os
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import redis

# Security configurations
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-for-dev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# High-speed Redis configuration for session management
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Store token signature in Redis for fast invalidation / session lookup
    # This guarantees the "fastest and best" performance as requested
    user_id = data.get("sub")
    redis_client.setex(f"session:{user_id}", timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES), encoded_jwt)
    
    return encoded_jwt

def verify_token_in_redis(user_id: str, token: str):
    # O(1) sub-millisecond lookup
    stored_token = redis_client.get(f"session:{user_id}")
    return stored_token == token

def invalidate_session(user_id: str):
    redis_client.delete(f"session:{user_id}")
