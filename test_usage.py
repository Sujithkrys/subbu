import os
import sys
from dotenv import load_dotenv
load_dotenv('.env')

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from db.supabase_client import get_or_create_usage, increment_usage

try:
    user_id = '2dd94ed3-73ba-4c66-a501-bda31c097aa0' # from my previous test
    usage = get_or_create_usage(user_id)
    print('Usage:', usage)
    
    usage2 = increment_usage(user_id, transcription_seconds=10)
    print('Updated Usage:', usage2)
except Exception as e:
    print('Error:', e)
