import traceback
import logging
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
import os
import aiofiles
from engines.engine import process_request
import json
import speech_recognition as sr

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/voice")
async def process_voice(
    audio: UploadFile = File(...),
    user_context: str = Form("{}"),
    current_page_context: str = Form("{}"),
    auth_token: str = Form("")
):
    try:
        user_ctx = json.loads(user_context)
        page_ctx = json.loads(current_page_context)

        # 1. Save audio to temp file
        temp_file = f"temp_{audio.filename}"
        async with aiofiles.open(temp_file, 'wb') as out_file:
            content = await audio.read()
            await out_file.write(content)

        # 2. Transcribe Audio
        recognizer = sr.Recognizer()
        transcribed_text = ""
        with sr.AudioFile(temp_file) as source:
            audio_data = recognizer.record(source)
            try:
                # Currently using Google Web Speech API (needs internet)
                transcribed_text = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                transcribed_text = ""
            except sr.RequestError as e:
                transcribed_text = ""
        
        # Cleanup temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)

        if not transcribed_text:
            return {"reply": "Sorry, I couldn't understand the audio.", "intent": "UNKNOWN", "action": None}

        # 3. Process using Engine
        result = process_request(
            message=transcribed_text,
            history=[],
            user_context=user_ctx,
            page_context=page_ctx,
            auth_token=auth_token
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
        logger.error(f"Filename: {audio.filename if audio else 'None'}")
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
