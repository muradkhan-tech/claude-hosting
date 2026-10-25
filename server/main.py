from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Claude AI Studio Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Claude AI Studio Backend Running 24/7", "status": "online"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "engine": "FastAPI Cloud Python Engine"}
