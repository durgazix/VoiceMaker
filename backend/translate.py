from deep_translator import GoogleTranslator
from typing import Dict, Optional

class Translator:
    """
    Translation service using Deep Translator → Google Translate API
    """

    def __init__(self):
        self.supported_languages: Dict[str, str] = {
            "en": "English", "es": "Spanish", "fr": "French", "de": "German",
            "it": "Italian", "pt": "Portuguese", "ru": "Russian", "ja": "Japanese",
            "ko": "Korean", "zh": "Chinese", "ar": "Arabic", "hi": "Hindi",
            "tr": "Turkish", "pl": "Polish", "nl": "Dutch", "sv": "Swedish",
            "da": "Danish", "no": "Norwegian", "fi": "Finnish", "el": "Greek",
            "cs": "Czech", "ro": "Romanian", "hu": "Hungarian", "bg": "Bulgarian",
            "hr": "Croatian", "sk": "Slovak", "sl": "Slovenian", "et": "Estonian",
            "lv": "Latvian", "lt": "Lithuanian", "uk": "Ukrainian", "vi": "Vietnamese",
            "th": "Thai", "id": "Indonesian", "ms": "Malay", "tl": "Filipino",
            "he": "Hebrew", "fa": "Persian", "ur": "Urdu", "bn": "Bengali",
            "ta": "Tamil", "te": "Telugu", "ml": "Malayalam", "kn": "Kannada",
            "gu": "Gujarati", "pa": "Punjabi", "ne": "Nepali", "si": "Sinhala",
            "my": "Myanmar", "km": "Khmer", "lo": "Lao"
        }

    def translate(self, text: str, target_lang: str, source_lang: Optional[str] = None) -> str:
        if not text.strip():
            return ""

        try:
            translator = GoogleTranslator(
                source=source_lang if source_lang else "auto",
                target=target_lang
            )
            return translator.translate(text)
        except Exception as e:
            print("Translation error:", e)
            return text

    def detect_language(self, text: str) -> str:
        try:
            test = GoogleTranslator(source="auto", target="en").translate(text)
            return "en" if test == text else "unknown"
        except Exception:
            return "unknown"

    def get_supported_languages(self) -> Dict[str, str]:
        return self.supported_languages
