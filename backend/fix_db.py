import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
sb: Client = create_client(url, key)

users = sb.auth.admin.list_users()
if users:
    print(f"Found user ID: {users[0].id}")
else:
    print("No users found in auth.users")

