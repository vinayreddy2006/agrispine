import traceback
import logging
import os
import uuid
import json
import aiofiles
from typing import Optional
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse
import speech_recognition as sr
from engines.engine import process_request
from core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


async def transcribe_audio_file(file_path: str, language: str = "en") -> str:
    """
    Transcribes an audio file into text using Groq Whisper (Whisper Large v3),
    with fallback to Google Web Speech Recognition.
    Supports English ('en'), Telugu ('te'), and Hindi ('hi').
    """
    transcribed_text = ""

    # 1. Primary: Groq Whisper (supports m4a, mp3, wav, flac directly)
    groq_api_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    if groq_api_key and groq_api_key.strip():
        try:
            import groq
            client = groq.Groq(api_key=groq_api_key.strip())
            whisper_lang = "en"
            lang_clean = (language or "en").lower().strip()
            if lang_clean in ["te", "telugu"]:
                whisper_lang = "te"
            elif lang_clean in ["hi", "hindi"]:
                whisper_lang = "hi"

            with open(file_path, "rb") as f:
                transcription = client.audio.transcriptions.create(
                    file=(os.path.basename(file_path), f.read()),
                    model="whisper-large-v3",
                    language=whisper_lang,
                    response_format="json"
                )
                transcribed_text = (getattr(transcription, "text", "") or "").strip()
                if transcribed_text:
                    logger.info(f"[Voice] Groq Whisper transcribed successfully ({whisper_lang}): {transcribed_text[:60]}")
                    return transcribed_text
        except Exception as e:
            logger.warning(f"[Voice] Groq Whisper transcription failed, attempting fallback: {e}")

    # 2. Fallback: Google Speech Recognition (speech_recognition library)
    try:
        recognizer = sr.Recognizer()
        google_lang = "en-IN"
        lang_clean = (language or "en").lower().strip()
        if lang_clean in ["te", "telugu"]:
            google_lang = "te-IN"
        elif lang_clean in ["hi", "hindi"]:
            google_lang = "hi-IN"

        with sr.AudioFile(file_path) as source:
            audio_data = recognizer.record(source)
            transcribed_text = recognizer.recognize_google(audio_data, language=google_lang)
            logger.info(f"[Voice] Google Speech transcribed successfully ({google_lang}): {transcribed_text[:60]}")
            return (transcribed_text or "").strip()
    except Exception as e:
        logger.warning(f"[Voice] Fallback speech recognition error: {e}")

    return (transcribed_text or "").strip()


@router.post("/transcribe")
async def transcribe_only(
    audio: Optional[UploadFile] = File(None),
    audio_file: Optional[UploadFile] = File(None),
    language: Optional[str] = Form("en"),
):
    """
    Dedicated speech-to-text endpoint for voice query previewing.
    Transcribes audio into text without automatically executing AI tasks.
    """
    upload = audio or audio_file
    if not upload:
        raise HTTPException(status_code=400, detail="No audio file provided in request.")

    ext = os.path.splitext(upload.filename or "")[1] or ".m4a"
    temp_file = f"temp_transcribe_{uuid.uuid4().hex}{ext}"

    try:
        content = await upload.read()
        if not content or len(content) < 100:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "text": "",
                    "transcribed_text": "",
                    "message": "Audio recording was empty or too short. Please speak clearly into your microphone."
                }
            )

        async with aiofiles.open(temp_file, "wb") as out_file:
            await out_file.write(content)

        text = await transcribe_audio_file(temp_file, language=language or "en")

        if not text:
            return JSONResponse(
                status_code=200,
                content={
                    "success": False,
                    "text": "",
                    "transcribed_text": "",
                    "message": "Could not recognize clear speech. Please check your microphone and speak clearly."
                }
            )

        return {
            "success": True,
            "text": text,
            "transcribed_text": text,
            "language": language or "en"
        }
    except Exception as e:
        logger.error(f"[AI Voice Transcribe] Error: {e}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "text": "",
                "transcribed_text": "",
                "message": f"Transcription error: {str(e)}"
            }
        )
    finally:
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception:
                pass


@router.post("/voice")
async def process_voice(
    audio: Optional[UploadFile] = File(None),
    audio_file: Optional[UploadFile] = File(None),
    user_context: str = Form("{}"),
    current_page_context: str = Form("{}"),
    auth_token: str = Form(""),
    language: Optional[str] = Form("en"),
    session_id: Optional[str] = Form("default"),
):
    upload = audio or audio_file
    if not upload:
        raise HTTPException(status_code=400, detail="No audio file provided.")

    ext = os.path.splitext(upload.filename or "")[1] or ".m4a"
    temp_file = f"temp_voice_{uuid.uuid4().hex}{ext}"

    try:
        try:
            user_ctx = json.loads(user_context) if isinstance(user_context, str) else (user_context or {})
        except Exception:
            user_ctx = {}

        try:
            page_ctx = json.loads(current_page_context) if isinstance(current_page_context, str) else (current_page_context or {})
        except Exception:
            page_ctx = {}

        # 1. Save audio to temp file
        content = await upload.read()
        if not content or len(content) < 100:
            return {
                "reply": "Audio recording was empty or too short. Please speak clearly into your microphone.",
                "intent": "UNKNOWN",
                "action": None,
                "transcribed_text": "",
                "success": False
            }

        async with aiofiles.open(temp_file, 'wb') as out_file:
            await out_file.write(content)

        # 2. Transcribe Audio
        transcribed_text = await transcribe_audio_file(temp_file, language=language or "en")

        if not transcribed_text:
            return {
                "reply": "Sorry, I couldn't understand the audio. Please check your microphone and speak clearly.",
                "intent": "UNKNOWN",
                "action": None,
                "transcribed_text": "",
                "success": False
            }

        # 3. Process using Engine
        result = process_request(
            message=transcribed_text,
            history=[],
            user_context=user_ctx,
            page_context=page_ctx,
            auth_token=auth_token,
            language=language or "en"
        )

        return {
            "reply": result.get("reply", "No response generated."),
            "intent": result.get("intent", "UNKNOWN"),
            "action": result.get("action"),
            "transcribed_text": transcribed_text,
            "success": result.get("success", True),
            "error": result.get("error"),
            "module": result.get("module"),
            "task": result.get("task"),
            "details": result.get("details")
        }
    except Exception as e:
        logger.error("="*50)
        logger.error("FATAL ERROR IN AI VOICE ROUTER")
        logger.error("="*50)
        logger.error(f"Filename: {upload.filename if upload else 'None'}")
        logger.error("TRACEBACK:")
        logger.error(traceback.format_exc())
        logger.error("="*50)

        return {
            "reply": "An internal error occurred while processing your voice request. Our system logged the issue.",
            "intent": "ERROR",
            "action": None,
            "transcribed_text": "",
            "success": False,
            "error": type(e).__name__,
            "module": "voice_router",
            "task": "process_voice",
            "details": str(e)
        }
    finally:
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception:
                pass
