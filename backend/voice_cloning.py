"""
Voice Cloning Module using Coqui TTS XTTS-v2
Supports cloning voices from audio samples and generating speech in cloned voices
"""
import os
import io
import base64
import tempfile
import uuid
from typing import Optional, Dict, List
from pathlib import Path

try:
    from TTS.api import TTS
    from TTS.utils.manage import ModelManager
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False
    print("Warning: Coqui TTS not available. Install with: pip install TTS")

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False


class VoiceCloning:
    """
    Voice cloning service using Coqui TTS XTTS-v2
    Allows users to clone their voice and use it for text-to-speech
    """
    
    def __init__(self, models_dir: str = "voice_models"):
        """
        Initialize voice cloning service
        
        Args:
            models_dir: Directory to store voice models and samples
        """
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(exist_ok=True)
        
        self.samples_dir = self.models_dir / "samples"
        self.samples_dir.mkdir(exist_ok=True)
        
        self.cloned_voices = {}  # {voice_id: sample_path}
        self.tts_model = None
        
        if TTS_AVAILABLE:
            try:
                # Initialize XTTS-v2 model (multilingual voice cloning)
                print("Loading Coqui TTS XTTS-v2 model...")
                self.tts_model = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", 
                                    progress_bar=False, gpu=False)
                print("Coqui TTS XTTS-v2 model loaded successfully")
            except Exception as e:
                print(f"Warning: Failed to load Coqui TTS model: {e}")
                print("Voice cloning will use fallback method")
                self.tts_model = None
        else:
            print("Coqui TTS not installed. Voice cloning disabled.")
    
    def clone_voice(self, audio_file: io.BytesIO, voice_id: str, language: str = "en") -> Dict:
        """
        Clone a voice from an audio sample
        
        Args:
            audio_file: Audio file as BytesIO (should be at least 3-10 seconds of clear speech)
            voice_id: Unique identifier for this voice
            language: Language code (e.g., 'en', 'es', 'fr')
        
        Returns:
            Dictionary with success status and voice_id
        """
        if not TTS_AVAILABLE or self.tts_model is None:
            raise Exception("Voice cloning is not available. Please install Coqui TTS.")
        
        try:
            # Read audio data
            audio_data = audio_file.read()
            audio_file.seek(0)
            
            if not audio_data:
                raise ValueError("Empty audio file received")
            
            # Save audio sample
            sample_path = self.samples_dir / f"{voice_id}.wav"
            
            # Convert to WAV format if needed
            if PYDUB_AVAILABLE:
                temp_input = None
                try:
                    # Save to temp file first
                    temp_dir = tempfile.gettempdir()
                    unique_id = str(uuid.uuid4())
                    temp_input = os.path.join(temp_dir, f"temp_clone_{unique_id}")
                    
                    with open(temp_input, "wb") as f:
                        f.write(audio_data)
                    
                    # Load and convert to WAV
                    audio = AudioSegment.from_file(temp_input)
                    # Ensure good quality: mono, 22050 Hz (XTTS preferred)
                    audio = audio.set_channels(1)
                    audio = audio.set_frame_rate(22050)
                    audio = audio.set_sample_width(2)
                    
                    # Export to WAV
                    audio.export(str(sample_path), format="wav")
                    
                    # Clean up temp file
                    if os.path.exists(temp_input):
                        os.remove(temp_input)
                except Exception as e:
                    if temp_input and os.path.exists(temp_input):
                        try:
                            os.remove(temp_input)
                        except:
                            pass
                    raise Exception(f"Audio conversion failed: {e}")
            else:
                # Fallback: save directly
                with open(sample_path, "wb") as f:
                    f.write(audio_data)
            
            # Verify file exists and has reasonable size
            if not sample_path.exists():
                raise FileNotFoundError("Failed to save voice sample")
            
            file_size = sample_path.stat().st_size
            if file_size < 10000:  # Less than 10KB is probably too short
                raise ValueError("Audio sample too short. Need at least 3-10 seconds of clear speech.")
            
            # Store voice reference
            self.cloned_voices[voice_id] = {
                "sample_path": str(sample_path),
                "language": language,
                "created_at": str(Path(sample_path).stat().st_mtime)
            }
            
            return {
                "success": True,
                "voice_id": voice_id,
                "message": "Voice cloned successfully"
            }
            
        except Exception as e:
            print(f"Voice cloning error: {e}")
            raise Exception(f"Failed to clone voice: {str(e)}")
    
    def synthesize(self, text: str, voice_id: str, language: str = "en") -> str:
        """
        Generate speech using a cloned voice
        
        Args:
            text: Text to convert to speech
            voice_id: ID of the cloned voice to use
            language: Language code (e.g., 'en', 'es', 'fr')
        
        Returns:
            Base64 encoded audio data
        """
        if not TTS_AVAILABLE or self.tts_model is None:
            raise Exception("Voice cloning is not available. Please install Coqui TTS.")
        
        if voice_id not in self.cloned_voices:
            raise ValueError(f"Voice ID '{voice_id}' not found. Please clone the voice first.")
        
        try:
            voice_info = self.cloned_voices[voice_id]
            sample_path = voice_info["sample_path"]
            
            # Generate speech using cloned voice
            output_path = tempfile.mktemp(suffix=".wav")
            
            # XTTS-v2 synthesis
            self.tts_model.tts_to_file(
                text=text,
                file_path=output_path,
                speaker_wav=sample_path,
                language=language
            )
            
            # Read generated audio
            with open(output_path, "rb") as f:
                audio_data = f.read()
            
            # Clean up temp file
            if os.path.exists(output_path):
                os.remove(output_path)
            
            # Convert to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            return f"data:audio/wav;base64,{audio_base64}"
            
        except Exception as e:
            print(f"Voice synthesis error: {e}")
            raise Exception(f"Failed to generate speech: {str(e)}")
    
    def list_cloned_voices(self) -> List[Dict]:
        """
        Get list of all cloned voices
        
        Returns:
            List of voice information dictionaries
        """
        voices = []
        for voice_id, voice_info in self.cloned_voices.items():
            voices.append({
                "voice_id": voice_id,
                "language": voice_info.get("language", "en"),
                "created_at": voice_info.get("created_at", "unknown")
            })
        return voices
    
    def delete_voice(self, voice_id: str) -> Dict:
        """
        Delete a cloned voice
        
        Args:
            voice_id: ID of the voice to delete
        
        Returns:
            Dictionary with success status
        """
        if voice_id not in self.cloned_voices:
            raise ValueError(f"Voice ID '{voice_id}' not found")
        
        try:
            voice_info = self.cloned_voices[voice_id]
            sample_path = Path(voice_info["sample_path"])
            
            # Delete sample file
            if sample_path.exists():
                sample_path.unlink()
            
            # Remove from dictionary
            del self.cloned_voices[voice_id]
            
            return {
                "success": True,
                "message": f"Voice '{voice_id}' deleted successfully"
            }
        except Exception as e:
            raise Exception(f"Failed to delete voice: {str(e)}")
    
    def is_available(self) -> bool:
        """Check if voice cloning is available"""
        return TTS_AVAILABLE and self.tts_model is not None

