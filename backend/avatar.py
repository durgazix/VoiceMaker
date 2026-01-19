import numpy as np
import json
from typing import Dict, List
from pydub import AudioSegment
import tempfile
import os

# OPTIONAL: Better phoneme extraction
try:
    import phonemizer
    PHONEMIZER_AVAILABLE = True
except:
    PHONEMIZER_AVAILABLE = False


class AvatarController:
    """
    Avatar lip-sync controller for anime avatar.
    Generates viseme timeline from either:
    - TTS audio bytes
    - Text (phoneme → viseme mapping)
    """

    def __init__(self):
        # Standard viseme set (29 mouth shapes)
        self.viseme_map = {
            'AA': 1, 'AE': 2, 'AH': 3, 'AO': 4, 'EH': 5, 'ER': 6,
            'IH': 7, 'IY': 8, 'UH': 9, 'UW': 10, 'B': 11, 'CH': 12,
            'D': 13, 'F': 14, 'G': 15, 'K': 16, 'L': 17, 'M': 18,
            'N': 19, 'P': 20, 'R': 21, 'S': 22, 'SH': 23, 'T': 24,
            'TH': 25, 'V': 26, 'W': 27, 'Y': 28, 'Z': 29, 
            'SIL': 0
        }

    # -----------------------------------------------------------------
    #  AUDIO → VISEMES   (simple amplitude → viseme approximation)
    # -----------------------------------------------------------------
    def process_audio(self, audio_bytes: bytes) -> Dict:
        """
        Convert audio bytes into a simple lip-sync timeline.
        Ideal for TTS audio returned as base64.
        """

        # Save audio to temp file
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        tmp.write(audio_bytes)
        tmp.close()

        audio = AudioSegment.from_file(tmp.name)
        os.remove(tmp.name)

        duration = len(audio) / 1000.0
        fps = 30
        frames = int(duration * fps)

        visemes = []

        for i in range(frames):
            start = int((i / fps) * 1000)
            end = start + 33
            chunk = audio[start:end]
            volume = chunk.dBFS if chunk.dBFS != float('-inf') else -50
            mouth = int(np.interp(volume, [-50, 0], [0, 15]))  # 0–15 mouth sizes

            visemes.append({
                "frame": i,
                "viseme": mouth,
                "time": i / fps
            })

        return {
            "visemes": visemes,
            "duration": duration,
            "fps": fps
        }

    # -----------------------------------------------------------------
    #  TEXT → VISEMES  (real phonemes if phonemizer is installed)
    # -----------------------------------------------------------------
    def process_text(self, text: str, language: str = "en") -> Dict:
        fps = 30
        visemes = []
        frame = 0

        if PHONEMIZER_AVAILABLE:
            phonemes = phonemizer.phonemize(
                text,
                language=language,
                backend="espeak",
                strip=True
            ).split()

            for p in phonemes:
                viseme_id = self.viseme_map.get(p.upper(), 0)
                visemes.append({
                    "frame": frame,
                    "viseme": viseme_id,
                    "time": frame / fps,
                    "phoneme": p
                })
                frame += 2

        else:
            # fallback simple mapping
            for char in text.lower():
                if char.isalpha():
                    viseme_id = self.viseme_map.get(char.upper(), 0)
                    visemes.append({
                        "frame": frame,
                        "viseme": viseme_id,
                        "time": frame / fps,
                        "phoneme": char
                    })
                    frame += 2

        return {
            "visemes": visemes,
            "duration": len(visemes) / fps,
            "fps": fps,
            "text": text
        }

    # -----------------------------------------------------------------
    #  VISUALIZATION OUTPUT
    # -----------------------------------------------------------------
    def generate_animation_data(self, viseme_data: Dict) -> str:
        return json.dumps(viseme_data)
