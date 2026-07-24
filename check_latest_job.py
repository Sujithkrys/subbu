import os
import sys
from dotenv import load_dotenv

load_dotenv('.env')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from db.supabase_client import get_supabase

sb = get_supabase()

# get the most recent project
res = sb.table("projects").select("*").order("created_at", desc=True).limit(1).execute()
if not res.data:
    print("No projects found.")
    sys.exit(0)

project = res.data[0]
print(f"Project: {project['id']}, status: {project.get('status')}")

# get jobs
jobs = sb.table("jobs").select("*").eq("project_id", project["id"]).execute()
for j in jobs.data:
    print(f"Job: {j['type']}, status: {j['status']}, error: {j.get('error')}")
