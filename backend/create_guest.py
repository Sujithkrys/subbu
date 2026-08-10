import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
sb: Client = create_client(url, key)

import uuid
guest_email = f"guest_{uuid.uuid4().hex[:8]}@subbu.local"

try:
    print(f"Creating fresh guest user: {guest_email}...")
    user = sb.auth.admin.create_user({
        "email": guest_email,
        "password": "guestpassword123!",
        "email_confirm": True,
    })
    print(f"FRESH_UUID: {user.user.id}")
except Exception as e:
    print(f"Error: {e}")
