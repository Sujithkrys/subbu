import os
import sys
from dotenv import load_dotenv

load_dotenv('.env')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from db.supabase_client import get_supabase

sb = get_supabase()

# get the project
res = sb.table("projects").select("*").eq("id", "6f85b72a-9797-4962-a825-154afaf2abc3").execute()
if res.data:
    print(res.data[0]["video_url"])
