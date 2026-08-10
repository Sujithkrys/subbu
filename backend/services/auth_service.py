import os
from fastapi import Header, HTTPException
from supabase import create_client

def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Bypass authentication for Guest user.
    """
    return {"id": "00000000-0000-0000-0000-000000000000"}
