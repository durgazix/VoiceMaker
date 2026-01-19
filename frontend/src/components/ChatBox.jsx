import React from 'react'
import './ChatBox.css'

const ChatBox = ({ 
  transcribedText,
  sttLanguage,
  enhancedText,
  translatedTexts, 
  audioUrls, 
  onPlayAudio,
  isPlaying,
  currentPlayingLang
}) => {
  const showEnhanced = enhancedText && enhancedText !== transcribedText
  
  const getLanguageName = (code) => {
    // Extract language code from format like "en-US" -> "en"
    const langCode = code ? code.split('-')[0] : ''
    const langNames = {
      'en': 'English', 'hi': 'Hindi', 'es': 'Spanish', 'fr': 'French',
      'de': 'German', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean',
      'zh': 'Chinese', 'ar': 'Arabic', 'pt': 'Portuguese', 'it': 'Italian'
    }
    return langNames[langCode] || langCode.toUpperCase()
  }
  
  return (
    <div className="chatbox">
      <h3>Transcription & Translations</h3>
      
      {transcribedText && (
        <div className="text-section">
          <h4>
            📝 Speech-to-Text 
            {sttLanguage && (
              <span className="language-badge">({getLanguageName(sttLanguage)})</span>
            )}
          </h4>
          <div className="text-box original">
            {transcribedText}
          </div>
        </div>
      )}

      {showEnhanced && (
        <div className="text-section">
          <h4>✨ Enhanced & Corrected Text:</h4>
          <div className="text-box enhanced">
            {enhancedText}
          </div>
        </div>
      )}

      {Object.keys(translatedTexts).length > 0 && (
        <div className="translations-section">
          <h4>Translated Texts (Exact Converted Words):</h4>
          <div className="translations-list">
            {Object.entries(translatedTexts).map(([langCode, text]) => (
              <div key={langCode} className="translation-item">
                <div className="translation-header">
                  <span className="language-label">{langCode.toUpperCase()}</span>
                  {audioUrls[langCode] && (
                    <button
                      className={`play-button ${isPlaying && currentPlayingLang === langCode ? 'playing' : ''}`}
                      onClick={() => onPlayAudio(langCode)}
                      disabled={isPlaying && currentPlayingLang !== langCode}
                    >
                      {isPlaying && currentPlayingLang === langCode ? '⏸️' : '▶️'} Play
                    </button>
                  )}
                </div>
                <div className="text-box translated">
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!transcribedText && (
        <div className="empty-state">
          <p>Record your speech to see transcription and translations here</p>
        </div>
      )}
    </div>
  )
}

export default ChatBox

