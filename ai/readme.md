# GramSathi AI Microservice (FastAPI)

The Python/FastAPI multi-agent AI service powering **GramSathi AI** across AgriSpine Web and Android.

## Prerequisites
- Python 3.10+ (3.11 recommended)
- Valid API key for the configured LLM provider (`GROQ_API_KEY` default, or `HF_API_KEY`/`HUGGINGFACEHUB_API_TOKEN`, or `GEMINI_API_KEY`)

## Environment Setup
1. Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Configure `ai/.env`:
   - `AI_PROVIDER=groq` (supported: `groq`, `huggingface`, `gemini`)
   - `GROQ_API_KEY=...` (also used for Groq Whisper `whisper-large-v3` speech-to-text)
   - Optional: `BACKEND_URL=http://localhost:5000` (used by outbound agents in `core/api_client.py`)
   - Optional: `PORT=8000` (default FastAPI port)

## Installation & Run
### Windows (PowerShell)
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### macOS / Linux
```bash
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Alternatively, launch directly with:
```bash
python main.py
```

## Health Check
- `GET http://localhost:8000/health`
- `GET http://localhost:8000/api/ai/health`
