import edge_tts
import asyncio
import base64
from gtts import gTTS
import tempfile
import os

class TextToSpeech:
    def __init__(self):
        # Map language codes to valid edge-tts voices
        # Supports all 14 languages from STT service
        self.voice_map = {
            "en": "en-US-AriaNeural",           # English (US)
            "en-US": "en-US-AriaNeural",        # English (US) - full code
            "hi": "hi-IN-SwaraNeural",          # Hindi (India)
            "hi-IN": "hi-IN-SwaraNeural",       # Hindi (India) - full code
            "ru": "ru-RU-DmitryNeural",         # Russian
            "ru-RU": "ru-RU-DmitryNeural",      # Russian - full code
            "fr": "fr-FR-DeniseNeural",         # French
            "fr-FR": "fr-FR-DeniseNeural",      # French - full code
            "es": "es-ES-AlvaroNeural",         # Spanish
            "es-ES": "es-ES-AlvaroNeural",      # Spanish - full code
            "de": "de-DE-ConradNeural",         # German
            "de-DE": "de-DE-ConradNeural",      # German - full code
            "ta": "ta-IN-ValluvarNeural",       # Tamil (India)
            "ta-IN": "ta-IN-ValluvarNeural",    # Tamil (India) - full code
            "te": "te-IN-MohanNeural",          # Telugu (India)
            "te-IN": "te-IN-MohanNeural",       # Telugu (India) - full code
            "ml": "ml-IN-MidhunNeural",         # Malayalam (India)
            "ml-IN": "ml-IN-MidhunNeural",      # Malayalam (India) - full code
            "bn": "bn-IN-Banerjeeneural",       # Bengali (India)
            "bn-IN": "bn-IN-Banerjeeneural",    # Bengali (India) - full code
            "ar": "ar-SA-HamedNeural",          # Arabic (Saudi Arabia)
            "ar-SA": "ar-SA-HamedNeural",       # Arabic (Saudi Arabia) - full code
            "zh": "zh-CN-YunxiNeural",          # Chinese (Mandarin)
            "zh-CN": "zh-CN-YunxiNeural",       # Chinese (Mandarin) - full code
            "ja": "ja-JP-NanamiNeural",         # Japanese
            "ja-JP": "ja-JP-NanamiNeural",      # Japanese - full code
            "ko": "ko-KR-InJoonNeural",         # Korean
            "ko-KR": "ko-KR-InJoonNeural",      # Korean - full code
        }
        
        # gTTS language mapping (short codes only for gTTS)
        self.gtts_lang_map = {
            "en": "en", "hi": "hi", "ru": "ru", "fr": "fr",
            "es": "es", "de": "de", "ta": "ta", "te": "te",
            "ml": "ml", "bn": "bn", "ar": "ar", "zh": "zh",
            "ja": "ja", "ko": "ko"
        }

    async def synthesize_edge(self, text: str, lang: str):
        """Use edge-tts (Microsoft) to synthesize speech"""
        voice = self.voice_map.get(lang, "en-US-AriaNeural")
        communicate = edge_tts.Communicate(text, voice)
        audio = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio += chunk["data"]
        return audio

    def synthesize_gtts(self, text: str, lang: str):
        """Fallback to gTTS (Google) if edge-tts fails"""
        # Extract short language code if full code provided
        lang_code = lang.split("-")[0] if "-" in lang else lang
        gtts_lang = self.gtts_lang_map.get(lang_code, "en")
        
        tts = gTTS(text=text, lang=gtts_lang)
        temp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        temp_name = temp.name
        temp.close()  # Close file before saving to it
        try:
            tts.save(temp_name)
            with open(temp_name, "rb") as f:
                audio = f.read()
            return audio
        finally:
            # Ensure file is deleted even if error occurs
            try:
                os.remove(temp_name)
            except Exception:
                pass

    def synthesize(self, text: str, lang: str, voice_id=None):
        """
        Synthesize text to speech.
        Prefers edge-tts, falls back to gTTS if edge-tts fails.
        """
        try:
            audio = asyncio.run(self.synthesize_edge(text, lang))
        except Exception as e:
            print(f"Edge-TTS failed for language '{lang}': {e}. Falling back to gTTS.")
            audio = self.synthesize_gtts(text, lang)

        return "data:audio/mp3;base64," + base64.b64encode(audio).decode()
    
    def get_supported_languages(self):
        """Return list of supported language codes"""
        return list(set([
            "en", "hi", "ru", "fr", "es", "de", "ta", "te", "ml", "bn", "ar", "zh", "ja", "ko"
        ]))
