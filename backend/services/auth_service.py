import os
from fastapi import Header, HTTPException
from supabase import create_client

def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Bypass authentication for Guest user.
    """
    return {"id": "3bb7971f-c3f7-4d59-82b5-16a0ffc5422c"}
