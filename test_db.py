import os
from dotenv import load_dotenv
load_dotenv('.env')
from supabase import create_client
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
sb = create_client(url, key)

projects = sb.table('projects').select('id, title, status, created_at').order('created_at', desc=True).limit(5).execute()
for p in projects.data:
    print(f"Project: {p['title']} - {p['id']} - {p['status']}")
    transcripts = sb.table('transcripts').select('id, language').eq('project_id', p['id']).execute()
    print('Transcripts:', transcripts.data)
