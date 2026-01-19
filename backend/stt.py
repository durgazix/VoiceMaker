import speech_recognition as sr
import io
from pydub import AudioSegment
import tempfile
import os
import shutil

class SpeechToText:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 200
        self.recognizer.dynamic_energy_threshold = True

        self.lang_map = {
            "en": "en-US",
            "hi": "hi-IN",
            "ru": "ru-RU",
            "fr": "fr-FR",
            "es": "es-ES",
            "de": "de-DE",
            "ta": "ta-IN",
            "te": "te-IN",
            "ml": "ml-IN",
            "bn": "bn-IN",
            "ar": "ar-SA",
            "zh": "zh-CN",
            "ja": "ja-JP",
            "ko": "ko-KR"
        }

    def transcribe(self, audio_file: io.BytesIO, filename_hint=None, language="en"):
        audio_file.seek(0)
        audio_bytes = audio_file.read()

        if not audio_bytes:
            raise Exception("Empty audio received")

        if not shutil.which("ffmpeg"):
            raise Exception("FFmpeg is not installed in the system")

        temp_in = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
        temp_in.write(audio_bytes)
        temp_in.close()
        temp_in_path = temp_in.name

        temp_out = temp_in_path + ".wav"

        try:
            fmt = None
            if filename_hint:
                ext = filename_hint.split(".")[-1].lower()
                if ext in ["webm", "wav", "mp3", "ogg", "opus", "m4a"]:
                    fmt = ext

            try:
                if fmt:
                    audio = AudioSegment.from_file(temp_in_path, format=fmt)
                else:
                    audio = AudioSegment.from_file(temp_in_path)
            except Exception as e:
                try:
                    audio = AudioSegment.from_file(temp_in_path, format="webm")
                except:
                    raise Exception(f"Could not load audio file: {str(e)}")

            audio = audio.set_channels(1).set_frame_rate(16000)
            
            normalized_audio = audio.normalize()
            
            if normalized_audio.dBFS < -30:
                gain_needed = -20 - normalized_audio.dBFS
                gain_needed = min(gain_needed, 10)
                normalized_audio = normalized_audio + gain_needed
            
            normalized_audio.export(temp_out, format="wav")

            if not os.path.exists(temp_out) or os.path.getsize(temp_out) == 0:
                raise Exception("WAV conversion failed - empty output file")

            with sr.AudioFile(temp_out) as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.2)
                data = self.recognizer.record(source)

            if language:
                lang_key = language.split('-')[0] if '-' in language else language
                lang_code = self.lang_map.get(lang_key, self.lang_map.get(language, "en-US"))
            else:
                lang_code = "en-US"

            try:
                text = self.recognizer.recognize_google(data, language=lang_code)
                if not text or text.strip() == "":
                    return {"text": "", "language": lang_code, "confidence": 0.0, "error": "No speech detected"}
                return {"text": text.strip(), "language": lang_code, "confidence": 0.9}
            except sr.UnknownValueError:
                return {"text": "", "language": lang_code, "confidence": 0.0, "error": "Could not understand audio"}
            except sr.RequestError as e:
                raise Exception(f"Speech recognition service error: {str(e)}")

        except Exception as e:
            error_msg = str(e)
            print(f"STT Error: {error_msg}")
            return {"text": "", "language": language or "en-US", "confidence": 0.0, "error": error_msg}

        finally:
            try:
                if os.path.exists(temp_in_path):
                    os.remove(temp_in_path)
            except: 
                pass
            try:
                if os.path.exists(temp_out):
                    os.remove(temp_out)
            except: 
                pass
