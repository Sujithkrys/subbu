import os
import sys
import requests
import time
from dotenv import load_dotenv

load_dotenv('.env')

# Let's bypass creating a token by just directly checking the code of backend/main.py.
# Wait, I can't generate a token without knowing the Supabase secret (which is not in .env).
# The anon key is in .env, but it's a JWT signed by Supabase.
# Actually, I CAN log in as a user to get a token!
from supabase import create_client

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')
sb = create_client(url, key)

# I can just sign up a dummy user to get an access token!
email = "dummy123@example.com"
password = "Password123!"
try:
    res = sb.auth.sign_up({"email": email, "password": password})
except:
    res = sb.auth.sign_in_with_password({"email": email, "password": password})

token = res.session.access_token

# Now I can make a request to the live backend!
project_id = '65be72c6-3940-4b04-8b51-eaeaf55f0072' # actually, this belongs to another user.
# So I'll get a 403 Access Denied. That's fine, let's see if 403 has CORS headers!

resp = requests.options(f"https://subbu-5j7u.onrender.com/projects/{project_id}/transcribe", headers={"Origin": "https://subbu.teamsvastrinots.workers.dev", "Access-Control-Request-Method": "POST"})
print("OPTIONS Headers:", resp.headers)

resp = requests.post(
    f"https://subbu-5j7u.onrender.com/projects/{project_id}/transcribe", 
    headers={
        "Origin": "https://subbu.teamsvastrinots.workers.dev",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    json={}
)
print("POST Headers:", resp.headers)
print("POST Status:", resp.status_code)
print("POST Body:", resp.text)
