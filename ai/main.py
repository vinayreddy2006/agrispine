from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from router import chat, voice

app = FastAPI(
    title="GramSathi AI",
    description="Multi-Agent Microservice for AgriSpine",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat.router, prefix="/api/ai", tags=["Chat"])
app.include_router(voice.router, prefix="/api/ai", tags=["Voice"])

@app.get("/")
@app.head("/")
async def root():
    return {"message": "GramSathi AI Ecosystem is Online"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
