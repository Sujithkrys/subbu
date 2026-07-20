import os
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from db.supabase_client import get_supabase
from services.auth_service import get_current_user
from services.storage_service import upload_file_to_r2

router = APIRouter(prefix="/voice-samples", tags=["voice-samples"])

@router.post("")
async def upload_voice_sample(
    file: UploadFile = File(...), 
    label: str = Form("My voice"),
    user: dict = Depends(get_current_user)
):
    """Upload a reference recording and create a voice_samples row."""
    try:
        content = await file.read()
        file_ext = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'webm'
        object_name = f"voice_samples/{user['id']}/{uuid.uuid4()}.{file_ext}"
        
        # Upload to R2
        upload_file_to_r2(content, object_name, file.content_type or "audio/webm")
        url = f"{os.getenv('R2_ENDPOINT')}/{os.getenv('R2_BUCKET_NAME')}/{object_name}"
        
        # Save to database
        sb = get_supabase()
        res = sb.table("voice_samples").insert({
            "user_id": user["id"],
            "storage_url": url,
            "label": label
        }).execute()
        
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def get_voice_samples(user: dict = Depends(get_current_user)):
    """List current user's saved samples."""
    sb = get_supabase()
    res = sb.table("voice_samples").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute()
    return res.data

@router.delete("/{sample_id}")
async def delete_voice_sample(sample_id: str, user: dict = Depends(get_current_user)):
    """Remove a sample."""
    sb = get_supabase()
    
    # Check ownership
    res = sb.table("voice_samples").select("id").eq("id", sample_id).eq("user_id", user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Voice sample not found")
        
    sb.table("voice_samples").delete().eq("id", sample_id).execute()
    return {"status": "success"}
