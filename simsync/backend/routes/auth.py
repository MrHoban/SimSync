from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from firebase_admin import auth
from .firebase_config import get_auth_client, get_firestore_client
from datetime import datetime
import logging

router = APIRouter()
security = HTTPBearer()

class UserResponse(BaseModel):
    uid: str
    email: str
    display_name: str = None
    subscription_tier: str = "basic"  # basic, premium
    subscription_status: str = "active"  # active, cancelled, expired
    storage_used: int = 0
    storage_limit: int = 50  # MB

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

async def get_user_subscription_info(user_id: str):
    """Get user's subscription information from Firestore"""
    try:
        db = get_firestore_client()
        
        # Get user document
        user_doc = db.collection('users').document(user_id).get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            return {
                'subscription_tier': user_data.get('subscription_tier', 'basic'),
                'subscription_status': user_data.get('subscription_status', 'active'),
                'storage_used': user_data.get('storage_used', 0),
                'storage_limit': user_data.get('storage_limit', 50 if user_data.get('subscription_tier', 'basic') == 'basic' else 500)
            }
        else:
            # Create new user document with basic tier
            user_data = {
                'subscription_tier': 'basic',
                'subscription_status': 'active',
                'storage_used': 0,
                'storage_limit': 50,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            db.collection('users').document(user_id).set(user_data)
            return {
                'subscription_tier': 'basic',
                'subscription_status': 'active', 
                'storage_used': 0,
                'storage_limit': 50
            }
    except Exception as e:
        print(f"Error getting user subscription info: {e}")
        # Return default basic tier on error
        return {
            'subscription_tier': 'basic',
            'subscription_status': 'active',
            'storage_used': 0,
            'storage_limit': 50
        }

@router.get("/test")
async def test_endpoint():
    """Test endpoint that doesn't require authentication"""
    return {"message": "Backend is working!", "timestamp": "2025-10-30"}

@router.get("/verify", response_model=UserResponse)
async def verify_user_token(user = Depends(verify_token)):
    """Verify user token and return user info with subscription details"""
    print(f"=== VERIFY ENDPOINT CALLED ===")
    try:
        # Get subscription information
        subscription_info = await get_user_subscription_info(user['uid'])
        
        result = UserResponse(
            uid=user['uid'],
            email=user.get('email', ''),
            display_name=user.get('name', user.get('email', '').split('@')[0]),
            subscription_tier=subscription_info['subscription_tier'],
            subscription_status=subscription_info['subscription_status'],
            storage_used=subscription_info['storage_used'],
            storage_limit=subscription_info['storage_limit']
        )
        print(f"Verify endpoint successful for user: {user['uid']} (tier: {subscription_info['subscription_tier']})")
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
        # Get subscription information
        subscription_info = await get_user_subscription_info(user_id)
        
        return UserResponse(
            uid=user_record.uid,
            email=user_record.email,
            display_name=user_record.display_name,
            subscription_tier=subscription_info['subscription_tier'],
            subscription_status=subscription_info['subscription_status'],
            storage_used=subscription_info['storage_used'],
            storage_limit=subscription_info['storage_limit']
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="User not found")

@router.post("/upgrade-subscription/{user_id}")
async def upgrade_user_subscription(user_id: str, user = Depends(verify_token)):
    """Upgrade user to premium subscription"""
    try:
        if user['uid'] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        db = get_firestore_client()
        
        # Update user subscription
        user_data = {
            'subscription_tier': 'premium',
            'subscription_status': 'active',
            'storage_limit': 500,  # 500MB for premium
            'updated_at': datetime.now(),
            'premium_activated_at': datetime.now()
        }
        
        db.collection('users').document(user_id).update(user_data)
        
        # Return updated subscription info
        subscription_info = await get_user_subscription_info(user_id)
        
        return {
            'message': 'Subscription upgraded successfully',
            'subscription_tier': subscription_info['subscription_tier'],
            'storage_limit': subscription_info['storage_limit']
        }
        
    except Exception as e:
        print(f"Error upgrading subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to upgrade subscription")