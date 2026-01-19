// import axios from 'axios'

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// })

// export const getSupportedLanguages = async () => {
//   try {
//     const response = await api.get('/api/languages')
//     return response.data
//   } catch (error) {
//     console.error('Error fetching supported languages:', error)
//     throw error
//   }
// }

// export const speechToText = async (audioBlob) => {
//   try {
//     const formData = new FormData()
//     formData.append('file', audioBlob, 'recording.webm')
    
//     const response = await api.post('/api/stt', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     })
//     return response.data
//   } catch (error) {
//     console.error('Error in speech-to-text:', error)
//     throw error
//   }
// }

// export const translateText = async (text, targetLanguages) => {
//   try {
//     const response = await api.post('/api/translate', {
//       text,
//       target_languages: targetLanguages
//     })
//     return response.data
//   } catch (error) {
//     console.error('Error in translation:', error)
//     throw error
//   }
// }

// export const textToSpeech = async (text, targetLanguages) => {
//   try {
//     const response = await api.post('/api/tts', {
//       text,
//       target_languages: targetLanguages
//     })
//     return response.data
//   } catch (error) {
//     console.error('Error in text-to-speech:', error)
//     throw error
//   }
// }

// export const completePipeline = async (audioBlob, targetLanguages, voiceId = null) => {
//   try {
//     const formData = new FormData()
//     formData.append('file', audioBlob, 'recording.webm')
    
//     if (targetLanguages) {
//       formData.append('target_languages', targetLanguages)
//     }
    
//     if (voiceId) {
//       formData.append('voice_id', voiceId)
//     }
    
//     const response = await api.post('/api/complete', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     })
//     return response.data
//   } catch (error) {
//     console.error('Error in complete pipeline:', error)
//     throw error
//   }
// }

// export const cloneVoice = async (audioBlob, voiceId, language = 'en') => {
//   try {
//     const formData = new FormData()
//     formData.append('audio', audioBlob, 'voice_sample.wav')
//     formData.append('voice_id', voiceId)
//     formData.append('language', language)
    
//     const response = await api.post('/api/voice/clone', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     })
//     return response.data
//   } catch (error) {
//     console.error('Error cloning voice:', error)
//     throw error
//   }
// }

// export const listClonedVoices = async () => {
//   try {
//     const response = await api.get('/api/voice/list')
//     return response.data
//   } catch (error) {
//     console.error('Error listing voices:', error)
//     throw error
//   }
// }

// export const deleteClonedVoice = async (voiceId) => {
//   try {
//     const response = await api.delete(`/api/voice/${voiceId}`)
//     return response.data
//   } catch (error) {
//     console.error('Error deleting voice:', error)
//     throw error
//   }
// }

// export const checkVoiceCloningStatus = async () => {
//   try {
//     const response = await api.get('/api/voice/status')
//     return response.data
//   } catch (error) {
//     console.error('Error checking voice cloning status:', error)
//     throw error
//   }
// }

// export default api



import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL
});

/* ---------------------------------------------------------
   Get Supported Languages
--------------------------------------------------------- */
export const getSupportedLanguages = async () => {
  try {
    const res = await api.get("/api/languages");
    return res.data;
  } catch (err) {
    console.error("❌ Error fetching languages:", err);
    throw err;
  }
};

/* ---------------------------------------------------------
   Speech → Text
--------------------------------------------------------- */
export const speechToText = async (audioBlob, language = null) => {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    if (language) {
      formData.append("language", language);
    }

    const res = await api.post("/api/stt", formData);
    return res.data;
  } catch (err) {
    console.error("❌ Error in STT:", err);
    throw err;
  }
};

/* ---------------------------------------------------------
   Translate text
--------------------------------------------------------- */
export const translateText = async (text, targetLanguages) => {
  try {
    const res = await api.post("/api/translate", {
      text,
      target_languages: targetLanguages
    });
    return res.data;
  } catch (err) {
    console.error("❌ Translation error:", err);
    throw err;
  }
};

/* ---------------------------------------------------------
   Text → Speech
--------------------------------------------------------- */
export const textToSpeech = async (text, targetLanguages, voiceId = null) => {
  try {
    const res = await api.post("/api/tts", {
      text,
      target_languages: targetLanguages,
      voice_id: voiceId
    });
    return res.data;
  } catch (err) {
    console.error("❌ TTS error:", err);
    throw err;
  }
};

/* ---------------------------------------------------------
   FULL PIPELINE (STT → Gemini → Translate → TTS)
--------------------------------------------------------- */
export const completePipeline = async (audioBlob, targetLanguages, voiceId = null, sttLanguage = null) => {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    if (Array.isArray(targetLanguages)) {
      formData.append("target_languages", targetLanguages.join(","));
    } else if (targetLanguages) {
      formData.append("target_languages", targetLanguages);
    }

    if (voiceId) formData.append("voice_id", voiceId);
    if (sttLanguage) formData.append("stt_language", sttLanguage);

    const res = await api.post("/api/complete", formData);
    return res.data;
  } catch (err) {
    console.error("❌ Complete pipeline error:", err);
    throw err;
  }
};

/* ---------------------------------------------------------
   Voice Cloning (Dummy Back-End Support)
--------------------------------------------------------- */
export const cloneVoice = async () => {
  console.warn("⚠️ Voice cloning is disabled in the backend.");
  return { message: "Voice cloning not available" };
};

export const listClonedVoices = async () => {
  try {
    const res = await api.get("/api/voice/list");
    return res.data;
  } catch (err) {
    console.error("❌ Error listing voices:", err);
    throw err;
  }
};

export const deleteClonedVoice = async (voiceId) => {
  try {
    const res = await api.delete(`/api/voice/${voiceId}`);
    return res.data;
  } catch (err) {
    console.error("❌ Error deleting cloned voice:", err);
    throw err;
  }
};

export const checkVoiceCloningStatus = async () => {
  try {
    const res = await api.get("/api/voice/status");
    return res.data;
  } catch (err) {
    console.error("❌ Voice cloning status error:", err);
    throw err;
  }
};

export default api;
