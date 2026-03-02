import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mic, MicOff, ChevronLeft, ChevronRight, AlertCircle, Clock } from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { submissions, interviews } from '../services/api'

const questions = [
  {
    id: 1,
    question: 'Tell us about a time when you had to debug a complex issue. What was your approach?',
    category: 'Problem Solving',
  },
  {
    id: 2,
    question: 'Describe your experience working in a team. How do you handle disagreements with colleagues?',
    category: 'Teamwork',
  },
  {
    id: 3,
    question: 'Tell us about a project you are most proud of. What was your role and impact?',
    category: 'Achievement',
  },
]

export default function BehavioralRound() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes per question
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
        setAnswers(prev => ({
          ...prev,
          [questions[currentQuestion].id]: ((prev[questions[currentQuestion].id] || '') + ' ' + currentTranscript).trim()
        }));
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
  }, [currentQuestion]);

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

  // Auto-advance
  useEffect(() => {
    if (timeLeft === 0 && !loading) {
      if (isRecording && recognition) recognition.stop();
      handleNext();
    }
  }, [timeLeft, loading, isRecording, recognition]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const { interviewId, submissionId } = location.state || {}

  const question = questions[currentQuestion]
  const currentAnswer = answers[question.id] || ''

  const handleAnswerChange = (value) => {
    setAnswers({
      ...answers,
      [question.id]: value,
    })
  }

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setTimeLeft(300) // Reset timer for next question
      if (isRecording && recognition) {
        recognition.stop();
        setIsRecording(false);
      }
    } else {
      await submitAllAndFinish()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setTimeLeft(300)
      if (isRecording && recognition) {
        recognition.stop();
        setIsRecording(false);
      }
    }
  }

  const submitAllAndFinish = async () => {
    setLoading(true)
    setError('')
    try {
      // Combine all answers into one comprehensive string for the backend
      const combinedResponse = questions.map((q) =>
        `Q: ${q.question}\nA: ${answers[q.id] || 'No answer provided.'}`
      ).join('\\n\\n')

      // 1. Submit behavioral response
      await submissions.submitBehavioral(submissionId, combinedResponse)

      // 2. Complete the interview to generate the final scores
      await interviews.complete(interviewId)

      // 3. Navigate to result page
      navigate('/result', { state: { interviewId } })
    } catch (err) {
      console.error('Failed to submit behavioral data:', err)
      setError(err.response?.data?.error || 'Failed to complete interview. Please try again.')
      setLoading(false)
    }
  }

  const isAnswered = currentAnswer.trim().length > 0

  if (!interviewId || !submissionId) {
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Behavioral Interview</h1>
              <span className="text-sm text-gray-400">{currentQuestion + 1} of {questions.length}</span>
            </div>
            <Card glass className="bg-gradient-to-r from-warning/10 to-danger/10 px-6 py-2">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-warning" />
                <div>
                  <p className="text-xs text-gray-400">Time Remaining</p>
                  <p className="text-xl font-bold text-warning">{formatTime(timeLeft)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-danger/10 border border-danger/50 text-danger rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Question */}
        <Card glass className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-2">{question.category}</p>
                <CardTitle className="text-xl">{question.question}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">Aim for 1-2 minutes. Focus on the situation, action, and result.</p>
          </CardContent>
        </Card>

        {/* Answer Input */}
        <Card glass className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Your Answer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="w-full h-48 bg-surface text-foreground border border-border rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type or speak your answer here..."
              disabled={loading}
            />

            <Button
              variant={isRecording ? 'danger' : 'outline'}
              className="w-full gap-2 border border-border"
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
                  <Mic size={18} /> Record Answer
                </>
              )}
            </Button>

            {isRecording && (
              <div className="flex items-center gap-2 p-3 bg-danger/10 rounded-lg border border-danger/20">
                <div className="w-2 h-2 bg-danger rounded-full animate-pulse" />
                <p className="text-sm text-danger">Recording... Speak now</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answered Questions Overview */}
        <Card glass className="mb-6 bg-surface/50">
          <CardHeader>
            <CardTitle className="text-sm">Answered Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(q.id - 1)}
                  disabled={loading}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${answers[q.id]
                    ? 'bg-success text-white'
                    : currentQuestion === q.id - 1
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border hover:border-primary text-white'
                    }`}
                >
                  {q.id}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0 || loading}
            className="flex-1 gap-2"
            type="button"
          >
            <ChevronLeft size={18} /> Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isAnswered || loading}
            className="flex-1 gap-2"
            type="button"
          >
            {loading
              ? 'Evaluating...'
              : currentQuestion === questions.length - 1
                ? 'Submit & View Results'
                : 'Next'
            }
            {!loading && <ChevronRight size={18} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
