from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from firebase_admin import auth
from .firebase_config import get_auth_client
import logging

router = APIRouter()
security = HTTPBearer()

class UserResponse(BaseModel):
    uid: str
    email: str
    display_name: str = None

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Firebase ID token with clock skew tolerance"""
    try:
        token = credentials.credentials
        
        # Try verification with default settings first
        try:
            decoded_token = auth.verify_id_token(token, check_revoked=False)
            print(f"Token verified for user: {decoded_token.get('uid')} ({decoded_token.get('email')})")
            return decoded_token
        except Exception as first_error:
            # If it's a timing error, wait a bit and try again
            if "Token used too early" in str(first_error):
                print("Clock skew detected, waiting 2 seconds and retrying...")
                import asyncio
                await asyncio.sleep(2)
                
                # Retry verification
                decoded_token = auth.verify_id_token(token, check_revoked=False)
                print(f"Token verified on retry for user: {decoded_token.get('uid')} ({decoded_token.get('email')})")
                return decoded_token
            else:
                raise first_error
                
    except Exception as e:
        print(f"Token verification failed: {str(e)}")
        logging.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.get("/test")
async def test_endpoint():
    """Test endpoint that doesn't require authentication"""
    return {"message": "Backend is working!", "timestamp": "2025-10-30"}

@router.get("/verify", response_model=UserResponse)
async def verify_user_token(user = Depends(verify_token)):
    """Verify user token and return user info"""
    print(f"=== VERIFY ENDPOINT CALLED ===")
    try:
        # Just return the information from the token instead of looking up the user
        result = UserResponse(
            uid=user['uid'],
            email=user.get('email', ''),
            display_name=user.get('name', user.get('email', '').split('@')[0])
        )
        print(f"Verify endpoint successful for user: {user['uid']}")
        return result
    except Exception as e:
        print(f"Error in verify endpoint: {e}")
        raise HTTPException(status_code=404, detail=f"User verification failed: {str(e)}")

@router.get("/user/{user_id}")
async def get_user_info(user_id: str, user = Depends(verify_token)):
    """Get user information by ID"""
    try:
        if user['uid'] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        user_record = auth.get_user(user_id)
        return UserResponse(
            uid=user_record.uid,
            email=user_record.email,
            display_name=user_record.display_name
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="User not found")