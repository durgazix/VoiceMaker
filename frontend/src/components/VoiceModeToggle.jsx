import React from 'react'
import './VoiceModeToggle.css'

const VoiceModeToggle = ({ 
  voiceMode, 
  onModeChange, 
  isProcessing,
  hasClonedVoice,
  voiceCloningAvailable 
}) => {
  return (
    <div className="voice-mode-toggle">
      <h3>Voice Mode</h3>
      <div className="mode-selector">
        <label className={`mode-option ${voiceMode === 'normal' ? 'active' : ''} ${isProcessing && voiceMode !== 'normal' ? 'disabled' : ''}`}>
          <input
            type="radio"
            name="voiceMode"
            value="normal"
            checked={voiceMode === 'normal'}
            onChange={() => onModeChange('normal')}
            disabled={isProcessing && voiceMode !== 'normal'}
          />
          <div className="mode-content">
            <span className="mode-icon">🔊</span>
            <span className="mode-label">Normal STT-TTS</span>
            <span className="mode-description">Standard voice synthesis</span>
          </div>
        </label>

        <label className={`mode-option ${voiceMode === 'own-voice' ? 'active' : ''} ${(!hasClonedVoice || !voiceCloningAvailable || (isProcessing && voiceMode !== 'own-voice')) ? 'disabled' : ''}`}>
          <input
            type="radio"
            name="voiceMode"
            value="own-voice"
            checked={voiceMode === 'own-voice'}
            onChange={() => onModeChange('own-voice')}
            disabled={!hasClonedVoice || !voiceCloningAvailable || (isProcessing && voiceMode !== 'own-voice')}
          />
          <div className="mode-content">
            <span className="mode-icon">🎤</span>
            <span className="mode-label">Hear Reply in Your Own Voice</span>
            <span className="mode-description">Uses your cloned voice</span>
          </div>
        </label>
      </div>
      
      {voiceMode === 'own-voice' && !hasClonedVoice && (
        <div className="warning-message">
          ⚠️ Please set up your voice first using the "Setup Your Voice" section below
        </div>
      )}
      
      {!voiceCloningAvailable && (
        <div className="warning-message">
          ⚠️ Voice cloning is not available. Please install Coqui TTS on the server.
        </div>
      )}
    </div>
  )
}

export default VoiceModeToggle

