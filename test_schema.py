import os
from dotenv import load_dotenv
load_dotenv('.env')
from supabase import create_client
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
sb = create_client(url, key)

try:
    res = sb.table('activity_log').select('*').limit(1).execute()
    print('activity_log:', res.data)
except Exception as e:
    print('activity_log err:', e)
