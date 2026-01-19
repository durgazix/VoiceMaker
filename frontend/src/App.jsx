import React, { useState, useEffect } from 'react'
import Recorder from './components/Recorder'
import Avatar from './components/Avatar'
import ChatBox from './components/ChatBox'
import VoiceModeToggle from './components/VoiceModeToggle'
import VoiceSetup from './components/VoiceSetup'
import { getSupportedLanguages, speechToText, textToSpeech, checkVoiceCloningStatus } from './services/api'
import './App.css'

function App() {
  const [supportedLanguages, setSupportedLanguages] = useState({})
  const [selectedTtsLanguage, setSelectedTtsLanguage] = useState('')
  const [sttLanguage, setSttLanguage] = useState('')
  const [transcribedText, setTranscribedText] = useState('')
  const [sttLanguageUsed, setSttLanguageUsed] = useState('')
  const [enhancedText, setEnhancedText] = useState('')
  const [translatedTexts, setTranslatedTexts] = useState({})
  const [audioUrls, setAudioUrls] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlayingLang, setCurrentPlayingLang] = useState(null)
  const [voiceMode, setVoiceMode] = useState('normal') // 'normal' or 'own-voice'
  const [currentVoiceId, setCurrentVoiceId] = useState(null)
  const [voiceCloningAvailable, setVoiceCloningAvailable] = useState(false)

  useEffect(() => {
    loadSupportedLanguages()
    checkVoiceCloningAvailability()
  }, [])

  const checkVoiceCloningAvailability = async () => {
    try {
      const status = await checkVoiceCloningStatus()
      setVoiceCloningAvailable(status.available)
    } catch (error) {
      console.error('Error checking voice cloning status:', error)
      setVoiceCloningAvailable(false)
    }
  }

  const loadSupportedLanguages = async () => {
    try {
      const res = await getSupportedLanguages()
      console.log("Languages received:", res)

      // store only translation section for dropdown
      const translationMap = res.translation || {}
      setSupportedLanguages(translationMap)

      const first = Object.keys(translationMap)[0] || ""
      setSelectedTtsLanguage(first)
      setSttLanguage(first || "en") // default input language

      if (!res.translation || Object.keys(res.translation).length === 0) {
        console.warn("No languages available in response")
      }

    } catch (error) {
      console.error("Error loading languages:", error)
      alert("Failed to load languages. Please check if backend is running.")
    }
  };

  const handleRecordingComplete = async (audioBlob) => {
    if (!sttLanguage) {
      alert('Please choose an input speech language first.')
      return
    }
    // Only process if the correct mode is active
    if (voiceMode === 'normal' && isProcessing) return
    if (voiceMode === 'own-voice' && (!currentVoiceId || isProcessing)) return

    setIsProcessing(true)
    try {
      // Step 1: STT only
      const sttResult = await speechToText(audioBlob, sttLanguage)
      
      // Check if transcription was successful
      if (!sttResult || !sttResult.text || sttResult.text.trim() === '') {
        const errorMsg = sttResult?.error || sttResult?.detail || 'No speech detected. Please try speaking louder or check your microphone.'
        alert(`Transcription failed: ${errorMsg}`)
        setTranscribedText('')
        return
      }
      
      const text = sttResult.text.trim()
      const detectedLang = sttResult.language || sttLanguage
      
      setTranscribedText(text)
      setSttLanguageUsed(detectedLang)
      setEnhancedText('')
      setTranslatedTexts({})
      setAudioUrls({})
    } catch (error) {
      console.error('Error transcribing audio:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Error transcribing audio. Please try again.'
      alert(`Transcription Error: ${errorMsg}`)
      setTranscribedText('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTtsLanguageSelect = (event) => {
    setSelectedTtsLanguage(event.target.value)
  }

  const convertToSpeech = async (targetLang) => {
    if (!transcribedText || !targetLang) return
    
    setIsProcessing(true)
    try {
      const voiceId = voiceMode === 'own-voice' ? currentVoiceId : null
      const result = await textToSpeech(transcribedText, [targetLang], voiceId)
      
      // Update translated texts and audio URLs
      setTranslatedTexts(prev => ({
        ...prev,
        ...result.translated_texts
      }))
      setAudioUrls(prev => ({
        ...prev,
        ...result.audio_urls
      }))
    } catch (error) {
      console.error('Error converting to speech:', error)
      alert('Error converting to speech. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVoiceModeChange = (mode) => {
    // Stop any ongoing processing when switching modes
    if (isProcessing) {
      if (window.confirm('Processing is in progress. Switch mode anyway?')) {
        setIsProcessing(false)
        setVoiceMode(mode)
      }
    } else {
      setVoiceMode(mode)
    }
  }

  const handleVoiceCloned = (voiceId) => {
    setCurrentVoiceId(voiceId)
    // Automatically switch to own-voice mode when voice is cloned
    if (voiceId) {
      setVoiceMode('own-voice')
    }
  }

  const handlePlaySelectedLanguage = () => {
    if (!selectedTtsLanguage) {
      alert('Please choose a target language first.')
      return
    }
    if (!audioUrls[selectedTtsLanguage]) {
      alert('No audio generated yet for this language. Please convert to speech first.')
      return
    }
    handlePlayAudio(selectedTtsLanguage)
  }

  const handleSttLanguageSelect = (event) => {
    setSttLanguage(event.target.value)
  }

  const handlePlayAudio = (langCode) => {
    if (audioUrls[langCode]) {
      const audio = new Audio(audioUrls[langCode])
      setIsPlaying(true)
      setCurrentPlayingLang(langCode)

      audio.onended = () => {
        setIsPlaying(false)
        setCurrentPlayingLang(null)
      }

      audio.onerror = () => {
        setIsPlaying(false)
        setCurrentPlayingLang(null)
        alert('Error playing audio')
      }

      audio.play()
    }
  }

  const getLanguageName = (code) => {
    if (supportedLanguages && supportedLanguages[code]) {
      return supportedLanguages[code]
    }
    return code.toUpperCase()
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎤 Anything-to-Speech Converter</h1>
        <p>Speak any language, convert to any language</p>
      </header>

      <div className="app-container">
        <div className="left-panel">
          <VoiceModeToggle
            voiceMode={voiceMode}
            onModeChange={handleVoiceModeChange}
            isProcessing={isProcessing}
            hasClonedVoice={!!currentVoiceId}
            voiceCloningAvailable={voiceCloningAvailable}
          />

          <VoiceSetup
            onVoiceCloned={handleVoiceCloned}
            currentVoiceId={currentVoiceId}
          />

          <Recorder
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing || (voiceMode === 'own-voice' && !currentVoiceId)}
            voiceMode={voiceMode}
            hasClonedVoice={!!currentVoiceId}
          />

          <div className="language-selection">
            <h3>Input Speech Language (STT)</h3>
            <select
              value={sttLanguage}
              onChange={handleSttLanguageSelect}
              disabled={isProcessing}
              className="language-dropdown"
            >
              <option value="">-- Choose input language --</option>

              {supportedLanguages && Object.keys(supportedLanguages).length > 0 ? (
                Object.keys(supportedLanguages).map((code) => (
                  <option key={code} value={code}>
                    {getLanguageName(code)}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading languages...</option>
              )}
            </select>
          </div>

          <div className="language-selection">
            <h3>Convert to Speech Language (TTS)</h3>
            <select
              value={selectedTtsLanguage}
              onChange={handleTtsLanguageSelect}
              disabled={isProcessing || !transcribedText}
              className="language-dropdown"
            >
              <option value="">-- Choose a language --</option>

              {supportedLanguages && Object.keys(supportedLanguages).length > 0 ? (
                Object.keys(supportedLanguages).map((code) => (
                  <option key={code} value={code}>
                    {supportedLanguages[code]}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading languages...</option>
              )}
            </select>
            {transcribedText && selectedTtsLanguage && (
              <button
                className="play-generated"
                onClick={() => convertToSpeech(selectedTtsLanguage)}
                disabled={isProcessing}
                style={{ marginTop: '10px', width: '100%' }}
              >
                {audioUrls[selectedTtsLanguage] ? '🔄 Convert Again' : '🔊 Convert to Speech'}
              </button>
            )}
            {audioUrls[selectedTtsLanguage] && (
              <button
                className="play-generated"
                onClick={handlePlaySelectedLanguage}
                disabled={isProcessing}
                style={{ marginTop: '10px', width: '100%' }}
              >
                ▶️ Play Generated Voice
              </button>
            )}
          </div>
        </div>

        <div className="right-panel">
          <Avatar
            isPlaying={isPlaying}
            currentLanguage={currentPlayingLang}
            visemeData={null}
          />

          <ChatBox
            transcribedText={transcribedText}
            sttLanguage={sttLanguageUsed}
            enhancedText={enhancedText}
            translatedTexts={translatedTexts}
            audioUrls={audioUrls}
            onPlayAudio={handlePlayAudio}
            isPlaying={isPlaying}
            currentPlayingLang={currentPlayingLang}
          />
        </div>
      </div>
    </div>
  )
}

export default App

