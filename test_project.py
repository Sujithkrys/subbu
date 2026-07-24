import os
import sys
from dotenv import load_dotenv
load_dotenv('.env')

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from db.supabase_client import get_project, get_or_create_usage

try:
    project = get_project('65be72c6-3940-4b04-8b51-eaeaf55f0072')
    print("Project:", project)
    if project:
        usage = get_or_create_usage(project['user_id'])
        print("Usage:", usage)
except Exception as e:
    import traceback
    traceback.print_exc()
    print("Error:", e)
