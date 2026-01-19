import compat
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException, Body, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import io
import asyncio
import uvicorn

from stt import SpeechToText
from tts import TextToSpeech
from translate import Translator
from gemini_service import GeminiService
from avatar import AvatarController

app = FastAPI(title="Anything-to-Speech")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    stt_service = SpeechToText()
except Exception as e:
    print("STT init failed:", e)
    stt_service = None

try:
    tts_service = TextToSpeech()
except Exception as e:
    print("TTS init failed:", e)
    tts_service = None

try:
    translator = Translator()
except Exception as e:
    print("Translator init failed:", e)
    translator = None

try:
    gemini_service = GeminiService()
except Exception as e:
    print("Gemini init failed:", e)
    gemini_service = None

try:
    avatar_controller = AvatarController()
except Exception as e:
    print("Avatar init failed:", e)
    avatar_controller = None

class TranslationRequest(BaseModel):
    text: str
    target_languages: List[str]
    voice_id: Optional[str] = None
    voice_id: Optional[str] = None


@app.get("/")
async def root():
    return {"message": "Backend OK"}

@app.post("/api/stt")
async def api_stt(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None)
):
    if not stt_service:
        raise HTTPException(503, "STT not initialized")

    try:
        data = await file.read()
        if not data:
            raise HTTPException(400, "Empty audio")

        bio = io.BytesIO(data)
        filename_hint = file.filename or "recording.webm"
        
        lang = language or "en"
        
        result = stt_service.transcribe(bio, filename_hint=filename_hint, language=lang)
        
        if not result.get("text") or result.get("text", "").strip() == "":
            error_msg = result.get("error", "No speech detected or transcription failed")
            raise HTTPException(400, f"Transcription failed: {error_msg}")
        
        if "language" not in result:
            result["language"] = result.get("language") or lang or "en-US"
            
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"STT API Error: {e}")
        raise HTTPException(500, f"STT processing error: {str(e)}")

@app.post("/api/translate")
async def api_translate(req: TranslationRequest):
    if not translator:
        raise HTTPException(503, "Translator not available")

    output = {
        lang: translator.translate(req.text, target_lang=lang)
        for lang in req.target_languages
    }
    return {"original": req.text, "translated": output}


@app.post("/api/tts")
async def api_tts(req: TranslationRequest):
    if not tts_service:
        raise HTTPException(503, "TTS not available")
    if not translator:
        raise HTTPException(503, "Translator not available")

    loop = asyncio.get_event_loop()
    audio_out = {}
    translated_texts = {}

    for lang in req.target_languages:
        translated = translator.translate(req.text, target_lang=lang)
        translated_texts[lang] = translated
        audio_out[lang] = await loop.run_in_executor(
            None,
            tts_service.synthesize,
            translated,
            lang,
            req.voice_id
        )

    return {"audio_urls": audio_out, "translated_texts": translated_texts}


@app.post("/api/complete")
async def api_complete(
    file: UploadFile = File(...),
    target_languages: Optional[str] = None,
    voice_id: Optional[str] = None,
    stt_language: Optional[str] = None
):
    if not stt_service or not tts_service or not translator:
        raise HTTPException(503, "Required services missing")

    audio_bytes = await file.read()
    bio = io.BytesIO(audio_bytes)

    lang_for_stt = stt_language or "en-US"
    stt_result = stt_service.transcribe(bio, language=lang_for_stt)
    original_text = stt_result.get("text", "")

    enhanced = original_text
    if gemini_service and gemini_service.is_available():
        enhanced = gemini_service.enhance_text(original_text).get("enhanced_text")

    langs = [l.strip() for l in (target_languages or "").split(",") if l.strip()]

    loop = asyncio.get_event_loop()
    translated_texts = {}
    audio_urls = {}

    for lang in langs:
        translated = translator.translate(enhanced, target_lang=lang)
        translated_texts[lang] = translated

        audio_urls[lang] = await loop.run_in_executor(
            None,
            tts_service.synthesize,
            translated,
            lang,
            voice_id
        )

    return {
        "text": original_text,
        "enhanced_text": enhanced if enhanced != original_text else None,
        "translated_texts": translated_texts,
        "audio_urls": audio_urls
    }


@app.post("/api/avatar")
async def avatar_from_text(
    text: str = Body(...),
    language: str = "en"
):
    if not avatar_controller:
        raise HTTPException(503, "Avatar unavailable")

    return avatar_controller.process_text(text, language)


@app.get("/api/languages")
async def api_languages():
    """
    Return supported languages for translation (map of code -> name)
    and STT (list of codes). Used by the frontend dropdown.
    """
    if not translator:
        fallback_languages = {
            "en": "English", "es": "Spanish", "fr": "French", "de": "German",
            "it": "Italian", "pt": "Portuguese", "ru": "Russian", "ja": "Japanese",
            "ko": "Korean", "zh": "Chinese", "ar": "Arabic", "hi": "Hindi"
        }
        return {
            "translation": fallback_languages,
            "stt": []
        }
    
    try:
        translation_langs = translator.get_supported_languages()
        stt_langs = stt_service.get_supported_languages() if stt_service and hasattr(stt_service, 'get_supported_languages') else []
        
        return {
            "translation": translation_langs if translation_langs else {},
            "stt": stt_langs
        }
    except Exception as e:
        print(f"Error getting languages: {e}")
        fallback_languages = {
            "en": "English", "es": "Spanish", "fr": "French", "de": "German",
            "it": "Italian", "pt": "Portuguese", "ru": "Russian", "ja": "Japanese",
            "ko": "Korean", "zh": "Chinese", "ar": "Arabic", "hi": "Hindi"
        }
        return {
            "translation": fallback_languages,
            "stt": []
        }

@app.get("/api/voice/status")
async def voice_status():
    return {"available": False, "message": "Voice cloning disabled"}

@app.get("/api/voice/list")
async def voice_list():
    return {"voices": []}

@app.post("/api/voice/clone")
async def clone_voice():
    raise HTTPException(503, "Voice cloning disabled")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
