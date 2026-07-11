import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, X, Volume2, VolumeX, Mic, Award } from 'lucide-react'
import TypingIndicator from './TypingIndicator'
import { interviewer } from '../services/api'

// Phase display config
const PHASE_CONFIG = {
  intro:      { label: 'Introduction',  color: '#6366f1', glow: 'rgba(99,102,241,0.4)' },
  approach:   { label: 'Approach',      color: '#22c55e', glow: 'rgba(34,197,94,0.4)' },
  coding:     { label: 'Coding',        color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  debrief:    { label: 'Debrief',       color: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
  behavioral: { label: 'Behavioral',    color: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  closing:    { label: 'Closing',       color: '#06b6d4', glow: 'rgba(6,182,212,0.4)' },
}

export default function InterviewerPanel({
  interviewId,
  questionContext = {},
  codeSnapshot = '',
  onCodeSubmitted = false,
  onSessionScored = () => {},
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [currentPhase, setCurrentPhase] = useState('intro')
  const [isTyping, setIsTyping] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [avatarState, setAvatarState] = useState('idle') // idle | speaking | thinking
  const [scoreCard, setScoreCard] = useState(null)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const utteranceRef = useRef(null)
  const debriefSentRef = useRef(false)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isTyping, scrollToBottom])

  // TTS function
  const speak = useCallback((text) => {
    if (!ttsEnabled || !window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = 0.9

    // Try to pick a natural-sounding voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      v.name.includes('Google') || v.name.includes('Samantha') ||
      v.name.includes('Daniel') || v.name.includes('Microsoft Mark') ||
      v.name.includes('Microsoft David')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0]

    if (preferred) utterance.voice = preferred

    utterance.onstart = () => setAvatarState('speaking')
    utterance.onend = () => setAvatarState('idle')
    utterance.onerror = () => setAvatarState('idle')

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [ttsEnabled])

  // Load voices (they load async in some browsers)
  useEffect(() => {
    window.speechSynthesis?.getVoices()
    window.speechSynthesis?.addEventListener?.('voiceschanged', () => {})
  }, [])

  // Initialize session when panel opens
  useEffect(() => {
    if (!isOpen || initialized) return

    const initSession = async () => {
      // Generate a client-side UUID as fallback for practice mode (no interviewId)
      const fallbackSid = crypto.randomUUID()

      try {
        // Only hit the DB-backed startSession if we have a real interviewId
        let sid = fallbackSid
        if (interviewId) {
          const res = await interviewer.startSession(
            interviewId,
            questionContext?.id || null,
            questionContext?.company_track || ''
          )
          sid = res.data.session.id
        }
        setSessionId(sid)
        setInitialized(true)

        // Send intro message
        setIsTyping(true)
        setAvatarState('thinking')
        const chatRes = await interviewer.chat(sid, 'intro', '', {
          ...questionContext,
          user_code_snapshot: codeSnapshot,
        })
        setMessages([{
          role: 'interviewer',
          content: chatRes.data.interviewer_message,
          timestamp: new Date()
        }])
        setCurrentPhase(chatRes.data.phase || 'intro')
        setIsTyping(false)
        speak(chatRes.data.interviewer_message)
      } catch (err) {
        console.error('Failed to start interviewer session:', err)
        // IMPORTANT: Always set sessionId so the user can still chat.
        // The Python /interviewer/chat endpoint will create a new in-memory
        // session on the fly if the session_id doesn't exist yet.
        setSessionId(fallbackSid)
        setIsTyping(false)
        setAvatarState('idle')
        setMessages([{
          role: 'interviewer',
          content: "Hello! I'm your AI interviewer. Let's discuss the problem you've been given. Can you walk me through your initial approach?",
          timestamp: new Date()
        }])
        setInitialized(true)
      }
    }
    initSession()
  }, [isOpen, initialized, interviewId, questionContext, codeSnapshot, speak])

  // Handle code submission → debrief phase
  useEffect(() => {
    if (onCodeSubmitted && sessionId && !debriefSentRef.current && !sessionEnded) {
      debriefSentRef.current = true
      sendMessageInternal('[Code submitted]', 'coding', true)
    }
  }, [onCodeSubmitted, sessionId, sessionEnded])

  const sendMessageInternal = async (text, phase, codeSubmitted = false) => {
    if (!sessionId || sessionEnded) return

    if (text !== '[Code submitted]') {
      setMessages(prev => [...prev, { role: 'candidate', content: text, timestamp: new Date() }])
    }
    setIsTyping(true)
    setAvatarState('thinking')
    window.speechSynthesis?.cancel()

    try {
      const res = await interviewer.chat(sessionId, phase || currentPhase, text, {
        ...questionContext,
        user_code_snapshot: codeSnapshot,
      }, codeSubmitted)

      const msg = res.data.interviewer_message
      setMessages(prev => [...prev, { role: 'interviewer', content: msg, timestamp: new Date() }])
      setCurrentPhase(res.data.phase || currentPhase)
      speak(msg)

      if (res.data.end_session) {
        await endSessionAndScore()
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'interviewer',
        content: "Let's continue — could you elaborate on your approach?",
        timestamp: new Date()
      }])
      setAvatarState('idle')
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = () => {
    const text = userInput.trim()
    if (!text || isTyping || sessionEnded) return
    setUserInput('')
    sendMessageInternal(text, currentPhase)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const endSessionAndScore = async () => {
    if (!sessionId || sessionEnded) return
    setSessionEnded(true)
    setAvatarState('idle')
    window.speechSynthesis?.cancel()

    try {
      const res = await interviewer.endSession(sessionId)
      const scores = res.data.scores
      setScoreCard(scores)
      onSessionScored(scores)
    } catch (err) {
      console.error('End session error:', err)
      setScoreCard({
        explanation_score: 50,
        behavioral_score: 50,
        explanation_feedback: 'Session ended',
        behavioral_feedback: 'Session ended',
      })
    }
  }

  const toggleTTS = () => {
    if (ttsEnabled) window.speechSynthesis?.cancel()
    setTtsEnabled(!ttsEnabled)
  }

  const phaseConf = PHASE_CONFIG[currentPhase] || PHASE_CONFIG.intro

  // --- Floating button when closed ---
  if (!isOpen) {
    return (
      <button
        id="interviewer-toggle-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 group"
        style={{
          background: `linear-gradient(135deg, ${phaseConf.color}, #6366f1)`,
          boxShadow: `0 0 30px ${phaseConf.glow}, 0 8px 32px rgba(0,0,0,0.4)`,
        }}
      >
        <MessageCircle size={28} className="text-white" />
        {messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
        <div className="absolute bottom-full mb-3 right-0 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
          🤖 AI Interviewer
        </div>
      </button>
    )
  }

  // --- Floating overlay panel ---
  return (
    <div
      id="interviewer-panel"
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-border shadow-2xl overflow-hidden"
      style={{
        width: '420px',
        height: '600px',
        maxHeight: 'calc(100vh - 48px)',
        background: 'rgba(15, 15, 25, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 0 40px ${phaseConf.glow}, 0 20px 60px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0"
        style={{ background: `linear-gradient(135deg, ${phaseConf.color}15, transparent)` }}
      >
        <div className="flex items-center gap-3">
          {/* Mini Avatar */}
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
              style={{
                background: `linear-gradient(135deg, ${phaseConf.color}, ${phaseConf.color}88)`,
                boxShadow: avatarState === 'speaking'
                  ? `0 0 20px ${phaseConf.glow}, 0 0 40px ${phaseConf.glow}`
                  : `0 0 10px ${phaseConf.glow}`,
                transition: 'box-shadow 0.3s ease',
              }}
            >
              🤖
            </div>
            {avatarState !== 'idle' && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background"
                style={{
                  background: avatarState === 'speaking' ? '#22c55e' : '#f59e0b',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">AI Interviewer</h3>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: `${phaseConf.color}25`, color: phaseConf.color }}
            >
              {phaseConf.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTTS}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title={ttsEnabled ? 'Mute' : 'Unmute'}
          >
            {ttsEnabled
              ? <Volume2 size={16} className="text-gray-400" />
              : <VolumeX size={16} className="text-gray-500" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Avatar Animation Area */}
      <div className="shrink-0 flex justify-center py-3 border-b border-border/50"
        style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="relative">
          {/* Avatar body */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl relative"
            style={{
              background: `linear-gradient(135deg, ${phaseConf.color}30, ${phaseConf.color}10)`,
              border: `2px solid ${phaseConf.color}40`,
              boxShadow: avatarState === 'speaking'
                ? `0 0 30px ${phaseConf.glow}, 0 0 60px ${phaseConf.glow}`
                : avatarState === 'thinking'
                  ? `0 0 15px ${phaseConf.glow}`
                  : `0 0 8px ${phaseConf.glow}`,
              transition: 'box-shadow 0.4s ease',
              animation: avatarState === 'idle' ? 'breathe 4s ease-in-out infinite' : 'none',
            }}
          >
            {/* Face */}
            <div className="relative">
              <span className="text-3xl">{avatarState === 'thinking' ? '🤔' : '🧑‍💻'}</span>
            </div>

            {/* Sound waves when speaking */}
            {avatarState === 'speaking' && (
              <>
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={`l${i}`} className="rounded-full" style={{
                      width: '3px',
                      height: `${8 + i * 4}px`,
                      background: phaseConf.color,
                      opacity: 0.6,
                      animation: `soundWave 0.6s ease-in-out infinite`,
                      animationDelay: `${i * 0.15}s`,
                    }} />
                  ))}
                </div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={`r${i}`} className="rounded-full" style={{
                      width: '3px',
                      height: `${8 + i * 4}px`,
                      background: phaseConf.color,
                      opacity: 0.6,
                      animation: `soundWave 0.6s ease-in-out infinite`,
                      animationDelay: `${i * 0.15 + 0.1}s`,
                    }} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Status text */}
          <p className="text-center text-xs text-gray-500 mt-1.5">
            {avatarState === 'speaking' ? '🔊 Speaking...' :
             avatarState === 'thinking' ? '💭 Thinking...' : '👂 Listening'}
          </p>
        </div>
      </div>

      {/* Score Card Overlay */}
      {scoreCard && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl border border-border p-6 text-center" style={{ background: 'rgba(30,30,45,0.95)' }}>
            <Award size={40} className="text-yellow-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-foreground mb-4">Interview Complete</h3>
            <div className="space-y-4 text-left">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Explanation</span>
                  <span className="font-bold" style={{ color: phaseConf.color }}>{scoreCard.explanation_score}/100</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${scoreCard.explanation_score}%`, background: `linear-gradient(90deg, ${phaseConf.color}, #22c55e)` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{scoreCard.explanation_feedback}</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Behavioral</span>
                  <span className="font-bold" style={{ color: '#a855f7' }}>{scoreCard.behavioral_score}/100</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${scoreCard.behavioral_score}%`, background: 'linear-gradient(90deg, #a855f7, #6366f1)' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{scoreCard.behavioral_feedback}</p>
              </div>
            </div>
            <button
              onClick={() => { setScoreCard(null); setIsOpen(false) }}
              className="mt-6 w-full py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${phaseConf.color}, #6366f1)` }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth" style={{ minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'candidate'
                  ? 'rounded-br-md text-white'
                  : 'rounded-bl-md text-gray-100'
              }`}
              style={{
                background: msg.role === 'candidate'
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'rgba(255,255,255,0.08)',
                border: msg.role === 'candidate' ? 'none' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2 rounded-2xl rounded-bl-md" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-3 border-t border-border/50" style={{ background: 'rgba(0,0,0,0.2)' }}>
        {sessionEnded ? (
          <div className="text-center text-sm text-gray-500 py-2">
            Session ended. {!scoreCard && 'Scoring...'}
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              disabled={isTyping || sessionEnded}
              rows={1}
              className="flex-1 bg-white/5 text-foreground text-sm rounded-xl px-4 py-2.5 border border-white/10 resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-500 disabled:opacity-50"
              style={{ maxHeight: '80px' }}
            />
            <button
              onClick={handleSend}
              disabled={!userInput.trim() || isTyping || sessionEnded}
              className="p-2.5 rounded-xl transition-all disabled:opacity-30 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${phaseConf.color}, #6366f1)`,
                boxShadow: userInput.trim() ? `0 0 15px ${phaseConf.glow}` : 'none',
              }}
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        )}
        {!sessionEnded && messages.length > 3 && (
          <div className="flex justify-center mt-2">
            <button
              onClick={endSessionAndScore}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline"
            >
              End Interview Session
            </button>
          </div>
        )}
      </div>

      {/* Global animations */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes soundWave {
          0%, 100% { transform: scaleY(0.5); opacity: 0.3; }
          50% { transform: scaleY(1.3); opacity: 0.8; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
