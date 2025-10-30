import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        # For development, we'll use environment variables
        # In production, you would use a service account key file
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        private_key = os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n')
        client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
        
        print(f"Initializing Firebase with project_id: {project_id}")
        print(f"Client email: {client_email}")
        print(f"Private key length: {len(private_key)} chars")
        
        cred_dict = {
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": private_key,
            "client_email": client_email,
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
            "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
        }
        
        try:
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred, {
                'storageBucket': f'{project_id}.firebasestorage.app'
            })
            print("Firebase Admin SDK initialized successfully!")
            print(f"Storage bucket configured: {project_id}.firebasestorage.app")
        except Exception as e:
            print(f"Firebase initialization failed: {e}")
            raise e

def get_firestore_client():
    """Get Firestore client"""
    return firestore.client()

def get_storage_bucket():
    """Get Storage bucket"""
    return storage.bucket()

def get_auth_client():
    """Get Auth client"""
    return auth