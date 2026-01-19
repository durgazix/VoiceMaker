import React, { useState, useRef } from 'react'
import { cloneVoice, listClonedVoices, deleteClonedVoice, checkVoiceCloningStatus } from '../services/api'
import './VoiceSetup.css'

const VoiceSetup = ({ onVoiceCloned, currentVoiceId }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [voiceId, setVoiceId] = useState(currentVoiceId || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [voiceCloningAvailable, setVoiceCloningAvailable] = useState(false)
  const [clonedVoices, setClonedVoices] = useState([])
  
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  React.useEffect(() => {
    checkAvailability()
    loadClonedVoices()
  }, [])

  React.useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const checkAvailability = async () => {
    try {
      const status = await checkVoiceCloningStatus()
      setVoiceCloningAvailable(status.available)
    } catch (error) {
      console.error('Error checking voice cloning status:', error)
      setVoiceCloningAvailable(false)
    }
  }

  const loadClonedVoices = async () => {
    try {
      const result = await listClonedVoices()
      setClonedVoices(result.voices || [])
      if (result.voices && result.voices.length > 0 && !currentVoiceId) {
        setVoiceId(result.voices[0].voice_id)
        if (onVoiceCloned) {
          onVoiceCloned(result.voices[0].voice_id)
        }
      }
    } catch (error) {
      console.error('Error loading cloned voices:', error)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!voiceId.trim()) {
      setError('Please enter a voice ID')
      return
    }

    setIsUploading(true)
    setError('')
    setSuccess('')

    try {
      const result = await cloneVoice(file, voiceId, 'en')
      setSuccess(`Voice "${voiceId}" cloned successfully!`)
      await loadClonedVoices()
      if (onVoiceCloned) {
        onVoiceCloned(voiceId)
      }
    } catch (error) {
      setError(error.response?.data?.detail || error.message || 'Failed to clone voice')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        if (!voiceId.trim()) {
          setError('Please enter a voice ID')
          stream.getTracks().forEach(track => track.stop())
          return
        }

        setIsUploading(true)
        setError('')
        setSuccess('')

        try {
          const result = await cloneVoice(audioBlob, voiceId, 'en')
          setSuccess(`Voice "${voiceId}" cloned successfully!`)
          await loadClonedVoices()
          if (onVoiceCloned) {
            onVoiceCloned(voiceId)
          }
        } catch (error) {
          setError(error.response?.data?.detail || error.message || 'Failed to clone voice')
        } finally {
          setIsUploading(false)
          stream.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setError('Error accessing microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleDeleteVoice = async (id) => {
    if (!window.confirm(`Are you sure you want to delete voice "${id}"?`)) {
      return
    }

    try {
      await deleteClonedVoice(id)
      await loadClonedVoices()
      if (currentVoiceId === id) {
        setVoiceId('')
        if (onVoiceCloned) {
          onVoiceCloned(null)
        }
      }
      setSuccess(`Voice "${id}" deleted successfully`)
    } catch (error) {
      setError(error.response?.data?.detail || error.message || 'Failed to delete voice')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!voiceCloningAvailable) {
    return (
      <div className="voice-setup">
        <h3>Setup Your Voice</h3>
        <div className="unavailable-message">
          Voice cloning is not available. Please install Coqui TTS on the server.
        </div>
      </div>
    )
  }

  return (
    <div className="voice-setup">
      <h3>Setup Your Voice</h3>
      <p className="setup-description">
        Record or upload 3-10 seconds of clear speech to clone your voice
      </p>

      <div className="voice-id-input">
        <label>Voice ID:</label>
        <input
          type="text"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          placeholder="e.g., my_voice"
          disabled={isUploading || isRecording}
        />
      </div>

      <div className="setup-options">
        <div className="setup-option">
          <button
            className="setup-button record"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading || !voiceId.trim()}
          >
            {isRecording ? '⏹️ Stop Recording' : '🎤 Record Voice'}
          </button>
          {isRecording && (
            <div className="recording-indicator">
              <div className="pulse-dot"></div>
              <span>{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        <div className="setup-option">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={isUploading || isRecording || !voiceId.trim()}
            style={{ display: 'none' }}
          />
          <button
            className="setup-button upload"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRecording || !voiceId.trim()}
          >
            📁 Upload Audio File
          </button>
        </div>
      </div>

      {isUploading && (
        <div className="uploading-indicator">
          <div className="spinner"></div>
          <span>Processing your voice...</span>
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {success && (
        <div className="success-message">{success}</div>
      )}

      {clonedVoices.length > 0 && (
        <div className="cloned-voices-list">
          <h4>Your Cloned Voices:</h4>
          <div className="voices-list">
            {clonedVoices.map((voice) => (
              <div key={voice.voice_id} className="voice-item">
                <span className="voice-name">{voice.voice_id}</span>
                <button
                  className="delete-voice-button"
                  onClick={() => handleDeleteVoice(voice.voice_id)}
                  disabled={isUploading || isRecording}
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceSetup

