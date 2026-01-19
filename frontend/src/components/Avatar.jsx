import React, { useEffect, useRef } from 'react'
import './Avatar.css'

const Avatar = ({ isPlaying, currentLanguage, visemeData }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw avatar face
    drawAvatar(ctx, centerX, centerY, isPlaying, 0)
  }, [isPlaying])

  const drawAvatar = (ctx, centerX, centerY, isTalking, time) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    bgGradient.addColorStop(0, '#667eea')
    bgGradient.addColorStop(1, '#764ba2')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Glow effect when talking
    if (isTalking) {
      const glowGradient = ctx.createRadialGradient(centerX, centerY - 20, 80, centerX, centerY - 20, 120)
      glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY - 20, 120, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw head (circle with gradient)
    const headGradient = ctx.createRadialGradient(
      centerX - 20, centerY - 40, 0,
      centerX, centerY - 20, 80
    )
    headGradient.addColorStop(0, '#FFE5CC')
    headGradient.addColorStop(1, '#FFDBAC')
    ctx.fillStyle = headGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY - 20, 80, 0, Math.PI * 2)
    ctx.fill()
    
    // Head shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw hair with gradient
    const hairGradient = ctx.createLinearGradient(centerX - 85, centerY - 20, centerX + 85, centerY - 20)
    hairGradient.addColorStop(0, '#654321')
    hairGradient.addColorStop(0.5, '#8B4513')
    hairGradient.addColorStop(1, '#654321')
    ctx.fillStyle = hairGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY - 20, 85, Math.PI, 0, false)
    ctx.fill()

    // Hair highlights
    ctx.strokeStyle = 'rgba(255, 200, 150, 0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY - 20, 85, Math.PI * 0.7, Math.PI * 1.3, false)
    ctx.stroke()

    // Draw eyes with blinking animation
    const eyeBlink = isTalking ? 1 : Math.abs(Math.sin(time * 0.002)) < 0.1 ? 0.3 : 1
    const eyeY = centerY - 40
    
    // Left eye
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(centerX - 25, eyeY, 12, 0, Math.PI * 2)
    ctx.fill()
    
    // Right eye
    ctx.beginPath()
    ctx.arc(centerX + 25, eyeY, 12, 0, Math.PI * 2)
    ctx.fill()

    // Eye pupils with movement when talking
    const pupilOffsetX = isTalking ? Math.sin(time * 0.01) * 2 : 0
    const pupilOffsetY = isTalking ? Math.cos(time * 0.008) * 1 : 0
    
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(centerX - 25 + pupilOffsetX, eyeY + pupilOffsetY, 8 * eyeBlink, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(centerX + 25 + pupilOffsetX, eyeY + pupilOffsetY, 8 * eyeBlink, 0, Math.PI * 2)
    ctx.fill()

    // Eye shine
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(centerX - 22, eyeY - 2, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(centerX + 28, eyeY - 2, 3, 0, Math.PI * 2)
    ctx.fill()

    // Draw eyebrows
    ctx.strokeStyle = '#654321'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(centerX - 40, eyeY - 15)
    ctx.quadraticCurveTo(centerX - 25, eyeY - 20, centerX - 10, eyeY - 15)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(centerX + 10, eyeY - 15)
    ctx.quadraticCurveTo(centerX + 25, eyeY - 20, centerX + 40, eyeY - 15)
    ctx.stroke()

    // Draw mouth (animated when talking)
    ctx.fillStyle = '#FF6B9D'
    if (isTalking) {
      // Animated open mouth
      const mouthHeight = 12 + Math.sin(time * 0.15) * 8
      const mouthWidth = 20 + Math.cos(time * 0.12) * 5
      ctx.beginPath()
      ctx.ellipse(centerX, centerY + 10, mouthWidth, mouthHeight, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // Teeth
      ctx.fillStyle = '#FFFFFF'
      const teethCount = 4
      const teethWidth = (mouthWidth * 2) / teethCount
      for (let i = 0; i < teethCount; i++) {
        ctx.beginPath()
        ctx.rect(centerX - mouthWidth + i * teethWidth, centerY + 5, teethWidth - 1, mouthHeight * 0.4)
        ctx.fill()
      }
    } else {
      // Closed mouth (smile)
      ctx.strokeStyle = '#FF6B9D'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(centerX, centerY + 10, 10, 0, Math.PI)
      ctx.stroke()
    }

    // Cheeks blush when talking
    if (isTalking) {
      const blushGradient = ctx.createRadialGradient(centerX - 35, centerY + 5, 0, centerX - 35, centerY + 5, 15)
      blushGradient.addColorStop(0, 'rgba(255, 182, 193, 0.6)')
      blushGradient.addColorStop(1, 'rgba(255, 182, 193, 0)')
      ctx.fillStyle = blushGradient
      ctx.beginPath()
      ctx.arc(centerX - 35, centerY + 5, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(centerX + 35, centerY + 5, 15, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Animate when playing
  useEffect(() => {
    if (isPlaying) {
      const canvas = canvasRef.current
      if (!canvas) return

      const animate = () => {
        timeRef.current += 16 // ~60fps
        const ctx = canvas.getContext('2d')
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawAvatar(ctx, centerX, centerY, true, timeRef.current)
        animationRef.current = requestAnimationFrame(animate)
      }

      animate()
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      timeRef.current = 0
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawAvatar(ctx, centerX, centerY, false, 0)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  const getLanguageName = (code) => {
    const langNames = {
      'en': 'English', 'hi': 'Hindi', 'es': 'Spanish', 'fr': 'French',
      'de': 'German', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean',
      'zh': 'Chinese', 'ar': 'Arabic', 'pt': 'Portuguese', 'it': 'Italian'
    }
    const langCode = code ? code.split('-')[0] : ''
    return langNames[langCode] || code?.toUpperCase() || ''
  }

  return (
    <div className="avatar-container">
      <h3>🎭 Avatar</h3>
      {currentLanguage && (
        <div className="avatar-language-badge">
          🗣️ Speaking: {getLanguageName(currentLanguage)}
        </div>
      )}
      <div className="avatar-wrapper">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="avatar-canvas"
        />
        {isPlaying && (
          <div className="avatar-glow"></div>
        )}
      </div>
      {isPlaying && (
        <div className="avatar-status">
          <div className="speaking-indicator"></div>
          <span>Speaking...</span>
        </div>
      )}
      {!isPlaying && !currentLanguage && (
        <div className="avatar-idle-message">
          Ready to speak
        </div>
      )}
    </div>
  )
}

export default Avatar

