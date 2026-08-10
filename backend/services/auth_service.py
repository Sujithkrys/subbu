import os
from fastapi import Header, HTTPException
from supabase import create_client

def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Bypass authentication for Guest user.
    """
    return {"id": "84fef9af-b2ca-4286-83d2-56df1cb71bb7"}
