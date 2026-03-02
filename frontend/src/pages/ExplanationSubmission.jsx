import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mic, MicOff, Send, AlertCircle, Clock } from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { submissions } from '../services/api'

export default function ExplanationSubmission() {
  const [explanation, setExplanation] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [recognition, setRecognition] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;

      rec.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
        }
        setExplanation(prev => (prev + ' ' + currentTranscript).trim());
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        if (event.error !== 'no-speech') {
          setError("Speech recognition error: " + event.error);
        }
      };

      setRecognition(rec);
    } else {
      console.warn("Speech recognition not supported in this browser.")
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setError('');
      try {
        recognition.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Timer effect
  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [loading, timeLeft])

  // Auto-submit
  useEffect(() => {
    if (timeLeft === 0 && !loading && explanation.trim()) {
      if (isRecording && recognition) recognition.stop();
      handleSubmit();
    }
  }, [timeLeft, loading, explanation, isRecording, recognition]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Retrieve data passed from CodingInterview
  const { interviewId, questionId, code, language, questionDescription } = location.state || {}

  const handleSubmit = async () => {
    if (!explanation.trim()) return

    setLoading(true)
    setError('')
    try {
      const res = await submissions.submitCode(
        interviewId,
        questionId,
        code,
        language || 'javascript',
        explanation
      )

      const submissionId = res.data.submission.id
      navigate('/follow-up', {
        state: {
          interviewId,
          submissionId,
          code,
          language,
          explanation
        }
      })
    } catch (err) {
      console.error('Failed to submit explanation:', err)
      setError(err.response?.data?.error || 'Failed to submit. Please try again.')
      setLoading(false)
    }
  }

  if (!interviewId || !code) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Session Error</h2>
        <p className="text-gray-400 mb-6">Interview session data not found. Please restart the interview.</p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Explain Your Approach</h1>
            <p className="text-gray-400">Walk us through your solution. You can type or use voice input.</p>
          </div>
          <Card glass className="bg-gradient-to-r from-warning/10 to-danger/10 px-6 py-3">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-warning" />
              <div>
                <p className="text-sm text-gray-400">Time Remaining</p>
                <p className="text-2xl font-bold text-warning">{formatTime(timeLeft)}</p>
              </div>
            </div>
          </Card>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-danger/10 border border-danger/50 text-danger rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Code Review Section */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Your Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-surface rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto border border-border">
                <pre className="text-foreground/80">{code}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Explanation Input */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Your Explanation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full h-40 bg-surface text-foreground border border-border rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Explain your solution, time complexity, space complexity, and edge cases you considered..."
              />

              <div className="flex gap-3">
                <Button
                  variant={isRecording ? 'danger' : 'outline'}
                  className="flex-1 gap-2 border border-border"
                  onClick={toggleRecording}
                  disabled={loading}
                  type="button"
                >
                  {isRecording ? (
                    <>
                      <MicOff size={18} /> Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic size={18} /> Record Explanation
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-surface rounded-lg p-4 space-y-2 text-sm">
                <p className="font-bold text-foreground">Tips for a great explanation:</p>
                <ul className="space-y-1 text-gray-400">
                  <li>• Explain your approach and algorithm choice</li>
                  <li>• Discuss time and space complexity</li>
                  <li>• Mention edge cases and how you handle them</li>
                  <li>• Be clear and concise (2-3 minutes ideal)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/interviews')}
              disabled={loading}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!explanation.trim() || loading}
              className="flex-1 gap-2"
              type="button"
            >
              <Send size={18} />
              {loading ? 'Submitting & Evaluating...' : 'Continue to Behavioral'}
            </Button>
          </div>

          {/* Info */}
          <Card glass className="bg-secondary/5 border-secondary/20">
            <div className="flex gap-3">
              <div className="text-secondary text-2xl">ℹ️</div>
              <div>
                <p className="text-sm font-medium mb-1">Next: AI Follow-Up Question</p>
                <p className="text-xs text-gray-400">The AI will analyze your explanation and ask a relevant technical follow-up question.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
