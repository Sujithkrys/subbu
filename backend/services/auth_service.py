import os
from fastapi import Header, HTTPException
from supabase import create_client

def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Dependency to extract user_id from Supabase JWT token.
    Returns a dictionary with at least the 'id' key.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    sb = create_client(os.getenv("SUPABASE_URL", ""), os.getenv("SUPABASE_ANON_KEY", ""))
    
    try:
        # Note: In production, you would typically verify the JWT directly instead of calling Supabase API on every request
        # But this works for our current setup
        user_response = sb.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="User not found")
            
        return {"id": user_response.user.id}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")
