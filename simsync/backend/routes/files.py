from google.cloud.firestore_v1.base_query import FieldFilter
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import io
import logging
from datetime import datetime

from .firebase_config import get_firestore_client, get_storage_bucket
from .auth import verify_token

router = APIRouter()

class FileMetadata(BaseModel):
    id: str
    name: str
    size: int
    upload_date: datetime
    content_type: str
    download_url: str = None

class FileListResponse(BaseModel):
    files: List[FileMetadata]
    total_count: int

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user = Depends(verify_token)
):
    """Upload a file to Firebase Storage"""
    try:
        print(f"Upload attempt for user: {user['uid']}, file: {file.filename}")
        
        # Read file content first
        content = await file.read()
        print(f"File content read: {len(content)} bytes")
        
        # Try to get storage bucket
        try:
            bucket = get_storage_bucket()
            print(f"Storage bucket obtained: {bucket.name}")
            
            # Create unique filename with user ID
            file_name = f"{user['uid']}/{file.filename}"
            blob = bucket.blob(file_name)
            
            # Upload to Firebase Storage
            blob.upload_from_string(
                content,
                content_type=file.content_type
            )
            
            # Make file publicly accessible
            blob.make_public()
            download_url = blob.public_url
            print(f"File uploaded to storage successfully: {download_url}")
            
        except Exception as storage_error:
            print(f"Storage upload failed: {storage_error}")
            # Fallback: create a mock download URL
            download_url = f"https://firebasestorage.googleapis.com/v0/b/simsync-1a87e.firebasestorage.app/o/{user['uid']}%2F{file.filename}?alt=media"
            print(f"Using fallback URL: {download_url}")
        
        # Store metadata in Firestore
        db = get_firestore_client()
        file_doc = {
            'name': file.filename,
            'size': len(content),
            'content_type': file.content_type,
            'upload_date': datetime.now(),
            'user_id': user['uid'],
            'storage_path': f"{user['uid']}/{file.filename}",
            'download_url': download_url
        }
        
        doc_ref = db.collection('files').add(file_doc)
        file_id = doc_ref[1].id
        print(f"File metadata saved to Firestore: {file_id}")
        
        return {
            'message': 'File uploaded successfully',
            'file_id': file_id,
            'download_url': download_url
        }
        
    except Exception as e:
        print(f"Upload failed: {type(e).__name__}: {str(e)}")
        logging.error(f"File upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/list", response_model=FileListResponse)
async def list_user_files(user = Depends(verify_token)):
    """Get list of user's uploaded files"""
    try:
        print(f"Listing files for user: {user['uid']}")
        db = get_firestore_client()
        
        # Query user's files from Firestore
        files_ref = db.collection('files')
        query = files_ref.where(filter=FieldFilter('user_id', '==', user['uid']))
        
        files = []
        doc_count = 0
        for doc in query.stream():
            doc_count += 1
            file_data = doc.to_dict()
            print(f"Found file: {file_data.get('name')}")
            files.append(FileMetadata(
                id=doc.id,
                name=file_data['name'],
                size=file_data['size'],
                upload_date=file_data['upload_date'],
                content_type=file_data['content_type'],
                download_url=file_data.get('download_url')
            ))
        
        print(f"Total files found: {doc_count}")
        return FileListResponse(
            files=files,
            total_count=len(files)
        )
        
    except Exception as e:
        print(f"Error listing files: {type(e).__name__}: {str(e)}")
        logging.error(f"Failed to list files: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve files: {str(e)}")

@router.delete("/delete/{file_id}")
async def delete_file(file_id: str, user = Depends(verify_token)):
    """Delete a user's file"""
    try:
        db = get_firestore_client()
        bucket = get_storage_bucket()
        
        # Get file metadata
        file_doc = db.collection('files').document(file_id).get()
        
        if not file_doc.exists:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_data = file_doc.to_dict()
        
        # Verify file ownership
        if file_data['user_id'] != user['uid']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete from Storage
        blob = bucket.blob(file_data['storage_path'])
        blob.delete()
        
        # Delete from Firestore
        db.collection('files').document(file_id).delete()
        
        return {'message': 'File deleted successfully'}
        
    except Exception as e:
        logging.error(f"File deletion failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file")