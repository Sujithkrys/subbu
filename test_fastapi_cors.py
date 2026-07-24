from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
import threading
import time

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import HTTPException

@app.get("/crash")
def crash():
    raise HTTPException(status_code=500, detail="Crash!")

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="error")

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(1)

resp = requests.get("http://127.0.0.1:8001/crash", headers={"Origin": "https://test.com"})
print("Status:", resp.status_code)
print("Headers:", resp.headers)
