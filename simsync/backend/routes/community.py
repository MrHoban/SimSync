"""Community file sharing routes for SimSync."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .firebase_config import get_firestore_client, get_storage_bucket
from .auth import verify_token
import uuid

router = APIRouter()

class ShareFileRequest(BaseModel):
    """Request model for sharing a file."""
    file_id: str
    description: Optional[str] = ""

class CommunityFile(BaseModel):
    """Response model for community files."""
    id: str
    original_file_id: str
    shared_by_uid: str
    shared_by_name: str
    file_name: str
    file_size: int
    description: str
    downloads_count: int
    average_rating: float
    rating_count: int
    created_at: datetime
    is_active: bool

class RateFileRequest(BaseModel):
    """Request model for rating a file."""
    rating: int  # 1-5 stars

@router.post("/share")
async def share_file(request: ShareFileRequest, user = Depends(verify_token)):
    """Share a user's file with the community."""
    try:
        db = get_firestore_client()
        
        # Get the original file info using document ID
        file_doc = db.collection('files').document(request.file_id).get()
        
        if not file_doc.exists:
            raise HTTPException(status_code=404, detail="File not found")
            
        original_file = file_doc.to_dict()
        
        # Verify the file belongs to the current user
        if original_file.get('user_id') != user['uid']:
            raise HTTPException(status_code=403, detail="You can only share your own files")
        
        # Check if file is already shared
        existing_share = db.collection('shared_files').where('original_file_id', '==', request.file_id).where('shared_by_uid', '==', user['uid']).stream()
        if list(existing_share):
            raise HTTPException(status_code=400, detail="File is already shared")
        
        # Create shared file entry
        shared_file_id = str(uuid.uuid4())
        shared_file_data = {
            'id': shared_file_id,
            'original_file_id': request.file_id,
            'shared_by_uid': user['uid'],
            'shared_by_name': user.get('name', user.get('email', '').split('@')[0]),
            'file_name': original_file['name'],
            'file_size': original_file['size'],
            'description': request.description,
            'downloads_count': 0,
            'ratings': {},
            'average_rating': 0.0,
            'rating_count': 0,
            'created_at': datetime.now(),
            'is_active': True,
            'file_type': original_file.get('content_type', ''),
            'storage_path': original_file['storage_path']
        }
        
        db.collection('shared_files').document(shared_file_id).set(shared_file_data)
        
        return {
            "message": "File shared successfully!",
            "shared_file_id": shared_file_id,
            "community_url": f"/community/{shared_file_id}"
        }
        
    except Exception as e:
        print(f"Error sharing file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to share file: {str(e)}")

@router.get("/files")
async def get_community_files(limit: int = 50, offset: int = 0):
    """Get list of community shared files."""
    try:
        db = get_firestore_client()
        
        # Get shared files ordered by creation date (newest first)
        query = (db.collection('shared_files')
                .where('is_active', '==', True)
                .order_by('created_at', direction='DESCENDING')
                .limit(limit)
                .offset(offset))
        
        shared_files = []
        for doc in query.stream():
            file_data = doc.to_dict()
            shared_files.append({
                'id': file_data['id'],
                'original_file_id': file_data['original_file_id'],
                'shared_by_uid': file_data['shared_by_uid'],
                'shared_by': file_data['shared_by_name'],
                'name': file_data['file_name'],
                'size': file_data['file_size'],
                'description': file_data['description'],
                'downloads': file_data['downloads_count'],
                'average_rating': file_data['average_rating'],
                'rating_count': file_data['rating_count'],
                'created_at': file_data['created_at'].isoformat() if isinstance(file_data['created_at'], datetime) else str(file_data['created_at'])
            })
        
        return {"files": shared_files, "total": len(shared_files)}
        
    except Exception as e:
        print(f"Error getting community files: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get community files: {str(e)}")

@router.post("/{shared_file_id}/download")
async def download_community_file(shared_file_id: str, user = Depends(verify_token)):
    """Download a community shared file."""
    try:
        db = get_firestore_client()
        
        # Get shared file info
        shared_file_doc = db.collection('shared_files').document(shared_file_id).get()
        if not shared_file_doc.exists:
            raise HTTPException(status_code=404, detail="Shared file not found")
        
        shared_file_data = shared_file_doc.to_dict()
        
        # Check user's download limits (if Basic tier)
        user_doc = db.collection('users').document(user['uid']).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            subscription_tier = user_data.get('subscription_tier', 'basic')
            
            if subscription_tier == 'basic':
                # Check daily download count
                today = datetime.now().date()
                downloads_today = user_data.get('daily_downloads', {}).get(str(today), 0)
                
                if downloads_today >= 10:  # Basic tier limit
                    raise HTTPException(status_code=429, detail="Daily download limit reached. Upgrade to Premium for unlimited downloads!")
        
        # Generate download URL
        bucket = get_storage_bucket()
        blob = bucket.blob(shared_file_data['storage_path'])
        
        if not blob.exists():
            raise HTTPException(status_code=404, detail="File not found in storage")
        
        # Generate signed URL (valid for 1 hour)
        download_url = blob.generate_signed_url(expiration=datetime.now().timestamp() + 3600, method='GET')
        
        # Update download count
        db.collection('shared_files').document(shared_file_id).update({
            'downloads_count': shared_file_data['downloads_count'] + 1
        })
        
        # Update user's daily download count (if Basic tier)
        if subscription_tier == 'basic':
            daily_downloads = user_data.get('daily_downloads', {})
            daily_downloads[str(today)] = downloads_today + 1
            db.collection('users').document(user['uid']).update({
                'daily_downloads': daily_downloads
            })
        
        return {
            "download_url": download_url,
            "file_name": shared_file_data['file_name'],
            "file_size": shared_file_data['file_size']
        }
        
    except Exception as e:
        print(f"Error downloading community file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")

@router.post("/{shared_file_id}/rate")
async def rate_community_file(shared_file_id: str, request: RateFileRequest, user = Depends(verify_token)):
    """Rate a community shared file."""
    try:
        if request.rating < 1 or request.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        db = get_firestore_client()
        
        # Get shared file
        shared_file_doc = db.collection('shared_files').document(shared_file_id).get()
        if not shared_file_doc.exists:
            raise HTTPException(status_code=404, detail="Shared file not found")
        
        shared_file_data = shared_file_doc.to_dict()
        
        # Can't rate your own file
        if shared_file_data['shared_by_uid'] == user['uid']:
            raise HTTPException(status_code=400, detail="You cannot rate your own file")
        
        # Update rating
        ratings = shared_file_data.get('ratings', {})
        old_rating = ratings.get(user['uid'])
        ratings[user['uid']] = request.rating
        
        # Recalculate average rating
        total_rating = sum(ratings.values())
        rating_count = len(ratings)
        average_rating = total_rating / rating_count if rating_count > 0 else 0
        
        # Update in database
        db.collection('shared_files').document(shared_file_id).update({
            'ratings': ratings,
            'average_rating': round(average_rating, 1),
            'rating_count': rating_count
        })
        
        return {
            "message": f"Rated {request.rating} stars!",
            "your_rating": request.rating,
            "average_rating": round(average_rating, 1),
            "total_ratings": rating_count,
            "previous_rating": old_rating
        }
        
    except Exception as e:
        print(f"Error rating file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to rate file: {str(e)}")

@router.delete("/{shared_file_id}")
async def unshare_file(shared_file_id: str, user = Depends(verify_token)):
    """Remove a file from community sharing."""
    try:
        db = get_firestore_client()
        
        # Get shared file
        shared_file_doc = db.collection('shared_files').document(shared_file_id).get()
        if not shared_file_doc.exists:
            raise HTTPException(status_code=404, detail="Shared file not found")
        
        shared_file_data = shared_file_doc.to_dict()
        
        # Only owner can unshare
        if shared_file_data['shared_by_uid'] != user['uid']:
            raise HTTPException(status_code=403, detail="You can only unshare your own files")
        
        # Soft delete (set inactive)
        db.collection('shared_files').document(shared_file_id).update({
            'is_active': False,
            'unshared_at': datetime.now()
        })
        
        return {"message": "File removed from community sharing"}
        
    except Exception as e:
        print(f"Error unsharing file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to unshare file: {str(e)}")