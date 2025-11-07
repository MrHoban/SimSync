"""Payment routes for Stripe integration."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import stripe
import os
from typing import Dict, Any
from datetime import datetime
from .firebase_config import get_firestore_client

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()

class PaymentRequest(BaseModel):
    """Request model for creating payment sessions."""
    success_url: str
    cancel_url: str
    user_id: str

@router.post("/create-checkout-session")
async def create_checkout_session(payment_request: PaymentRequest) -> Dict[str, Any]:
    """
    Create a Stripe checkout session for premium subscription.
    
    Args:
        payment_request: Payment request with URLs and user ID
        
    Returns:
        Dict containing checkout session URL
        
    Raises:
        HTTPException: If session creation fails
    """
    try:
        # Get price ID from environment
        price_id = os.getenv("STRIPE_PRICE_ID")
        if not price_id:
            raise HTTPException(status_code=500, detail="Stripe price ID not configured")
            
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=payment_request.success_url,
            cancel_url=payment_request.cancel_url,
            client_reference_id=payment_request.user_id,
            metadata={
                'user_id': payment_request.user_id
            }
        )
        
        return {"url": checkout_session.url}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/webhook")
async def stripe_webhook(request: Dict[str, Any]) -> Dict[str, str]:
    """
    Handle Stripe webhook events.
    
    Args:
        request: Stripe webhook payload
        
    Returns:
        Dict with success status
    """
    try:
        # In production, verify the webhook signature here
        event = request
        
        # Handle successful payment
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            user_id = session.get('client_reference_id')
            
            if user_id:
                print(f"Payment successful for user: {user_id}")
                
                # Update user's subscription in Firestore
                try:
                    db = get_firestore_client()
                    
                    user_data = {
                        'subscription_tier': 'premium',
                        'subscription_status': 'active',
                        'storage_limit': 500,  # 500MB for premium
                        'updated_at': datetime.now(),
                        'premium_activated_at': datetime.now(),
                        'stripe_session_id': session.get('id'),
                        'stripe_customer_id': session.get('customer')
                    }
                    
                    db.collection('users').document(user_id).update(user_data)
                    print(f"User {user_id} upgraded to premium successfully")
                    
                except Exception as db_error:
                    print(f"Error updating user subscription in database: {db_error}")
                    # Don't fail the webhook, log the error
                
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")