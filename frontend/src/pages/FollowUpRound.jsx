import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mic, MicOff, Send, AlertCircle, Clock } from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { submissions } from '../services/api'

export default function FollowUpRound() {
    const [question, setQuestion] = useState('')
    const [answer, setAnswer] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
    const [recognition, setRecognition] = useState(null)

    const navigate = useNavigate()
    const location = useLocation()

    const { interviewId, submissionId, code, language, explanation } = location.state || {}

    // Fetch follow up question on mount
    useEffect(() => {
        const fetchFollowUp = async () => {
            try {
                const res = await submissions.generateFollowUp(submissionId, code, explanation);
                setQuestion(res.data.question);
            } catch (err) {
                console.error('Failed to generate follow up:', err);
                setError(err.response?.data?.error || 'Failed to generate follow-up. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (submissionId && code) {
            fetchFollowUp();
        } else {
            setLoading(false);
        }
    }, [submissionId, code, explanation]);

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
                setAnswer(prev => (prev + ' ' + currentTranscript).trim());
            };

            rec.onend = () => setIsRecording(false);
            rec.onerror = (event) => {
                setIsRecording(false);
                if (event.error !== 'no-speech') setError("Speech recognition error: " + event.error);
            };

            setRecognition(rec);
        }
    }, []);

    const toggleRecording = () => {
        if (!recognition) return setError("Speech recognition is not supported in your browser.");
        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        } else {
            setError('');
            try { recognition.start(); setIsRecording(true); } catch (e) { }
        }
    };

    // Timer effect
    useEffect(() => {
        if (loading || timeLeft <= 0 || !question) return;
        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
        return () => clearInterval(interval)
    }, [loading, timeLeft, question])

    // Auto-submit
    useEffect(() => {
        if (timeLeft === 0 && !loading && answer.trim()) {
            if (isRecording && recognition) recognition.stop();
            handleSubmit();
        }
    }, [timeLeft, loading, answer, isRecording, recognition]);

    const handleSubmit = async () => {
        if (!answer.trim()) return

        setSubmitting(true)
        setError('')
        try {
            await submissions.submitFollowUp(submissionId, question, answer)

            // Go to behavioral
            navigate('/behavioral', {
                state: {
                    interviewId,
                    submissionId,
                    code,
                    language
                }
            })
        } catch (err) {
            console.error('Failed to submit follow-up:', err)
            setError(err.response?.data?.error || 'Failed to submit. Please try again.')
            setSubmitting(false)
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (!interviewId || !submissionId) {
        return (
            <div className="min-h-screen bg-background flex flex-col justify-center items-center text-center">
                <AlertCircle size={48} className="text-danger mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Session Error</h2>
                <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
            </div>
        )
    }

    if (loading) {
        return <div className="min-h-screen bg-background flex justify-center items-center text-white">Generating AI Follow-Up...</div>
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Technical Follow-Up</h1>
                        <p className="text-gray-400">Based on your code and explanation.</p>
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
                    {/* Question Section */}
                    <Card glass>
                        <CardHeader>
                            <CardTitle className="text-lg text-primary">AI Question</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-surface rounded-lg p-4 text-white border border-border text-lg font-medium">
                                {question}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Explanation Input */}
                    <Card glass>
                        <CardHeader>
                            <CardTitle className="text-lg">Your Answer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="w-full h-40 bg-surface text-foreground border border-border rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Explain your approach to the follow-up question..."
                                disabled={submitting}
                            />

                            <Button
                                variant={isRecording ? 'danger' : 'outline'}
                                className="w-full gap-2 border border-border"
                                onClick={toggleRecording}
                                disabled={submitting}
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
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex justify-end mt-6">
                        <Button
                            onClick={handleSubmit}
                            disabled={!answer.trim() || submitting}
                            className="px-8 gap-2"
                            type="button"
                        >
                            <Send size={18} />
                            {submitting ? 'Evaluating...' : 'Continue to Behavioral'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
