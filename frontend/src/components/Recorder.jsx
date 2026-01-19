import React, { useState, useRef, useEffect } from 'react'
import './Recorder.css'

const Recorder = ({ onRecordingComplete, isProcessing, voiceMode, hasClonedVoice }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        onRecordingComplete(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Error accessing microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isDisabled = isProcessing || (voiceMode === 'own-voice' && !hasClonedVoice)

  return (
    <div className="recorder">
      <h2>Record Your Speech</h2>
      {voiceMode && (
        <div className={`mode-badge ${voiceMode === 'own-voice' ? 'own-voice' : 'normal'}`}>
          {voiceMode === 'own-voice' ? '🎤 Your Voice Mode' : '🔊 Normal Mode'}
        </div>
      )}
      <div className="recorder-controls">
        {!isRecording ? (
          <button 
            className="record-button start"
            onClick={startRecording}
            disabled={isDisabled}
          >
            🎤 Start Recording
          </button>
        ) : (
          <button 
            className="record-button stop"
            onClick={stopRecording}
          >
            ⏹️ Stop Recording
          </button>
        )}
      </div>
      
      {voiceMode === 'own-voice' && !hasClonedVoice && (
        <div className="warning-message">
          ⚠️ Please set up your voice first to use this mode
        </div>
      )}

      {isRecording && (
        <div className="recording-indicator">
          <div className="pulse-dot"></div>
          <span>Recording... {formatTime(recordingTime)}</span>
        </div>
      )}

      {isProcessing && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <span>Processing your speech...</span>
        </div>
      )}
    </div>
  )
}

export default Recorder

