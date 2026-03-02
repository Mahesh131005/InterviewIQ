import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, TrendingUp, Award, BarChart3, AlertCircle, Lightbulb } from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { interviews } from '../services/api'

const COLORS = ['#5a7cff', '#9b88ff', '#ff9580']

export default function Result() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [interviewData, setInterviewData] = useState(null)
  const [questionsData, setQuestionsData] = useState([])

  const location = useLocation()
  const navigate = useNavigate()

  const { interviewId } = location.state || {}

  useEffect(() => {
    const fetchResults = async () => {
      if (!interviewId) {
        setLoading(false)
        return
      }

      try {
        const [detailsRes, questionsRes] = await Promise.all([
          interviews.getDetails(interviewId),
          interviews.getQuestions(interviewId)
        ])

        setInterviewData(detailsRes.data.interview)
        setQuestionsData(questionsRes.data.questions || [])
      } catch (err) {
        console.error('Failed to load results:', err)
        setError('Failed to load interview results. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [interviewId])

  if (loading) {
    return <div className="min-h-screen bg-background flex justify-center items-center text-white">Loading Results...</div>
  }

  if (!interviewId || error || !interviewData) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Result Error</h2>
        <p className="text-gray-400 mb-6">{error || 'Interview session data not found.'}</p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    )
  }

  // Calculate aggregates from the questions data
  const totalQuestions = questionsData.length || 1
  let avgCorrectness = 0
  let avgEfficiency = 0
  let avgExplanation = 0
  let avgBehavioral = 0
  let totalPassedTestcases = 0
  let totalAllTestcases = 0

  questionsData.forEach(q => {
    avgCorrectness += q.correctness_score || 0
    avgEfficiency += q.efficiency_score || 0
    avgExplanation += q.explanation_score || 0
    avgBehavioral += q.behavioral_score || 0
    totalPassedTestcases += q.passed_testcases || 0
    totalAllTestcases += q.total_testcases || 0
  })

  // Convert from 0-1 range to percentage
  const calcPercent = (sum, count) => count > 0 ? Math.round((sum / count) * 100) : 0;

  const performanceData = [
    { category: 'Coding correctness', value: calcPercent(avgCorrectness, totalQuestions) },
    { category: 'Explanation', value: calcPercent(avgExplanation, totalQuestions) },
    { category: 'Behavioral', value: calcPercent(avgBehavioral, totalQuestions) },
  ]

  const feedbackData = [
    { name: 'Correctness', value: calcPercent(avgCorrectness, totalQuestions) },
    { name: 'Complexity', value: calcPercent(avgEfficiency, totalQuestions) },
    { name: 'Communication', value: calcPercent(avgExplanation, totalQuestions) },
    { name: 'Behavioral', value: calcPercent(avgBehavioral, totalQuestions) },
  ]

  // Overall score comes from interviewData.overall_score (0-1 range)
  const parsedScore = parseFloat(interviewData.overall_score);
  const overallScore = !isNaN(parsedScore) ? Math.round(parsedScore * 100) : 0;

  // Generate personalized suggestions
  const generateSuggestions = () => {
    const suggestions = [];
    const avgC = (avgCorrectness / totalQuestions) * 100;
    const avgE = (avgEfficiency / totalQuestions) * 100;
    const avgEx = (avgExplanation / totalQuestions) * 100;
    const avgB = (avgBehavioral / totalQuestions) * 100;

    if (avgC < 75) suggestions.push({
      title: 'Improve Coding Correctness',
      text: 'Focus on edge cases and test your logic thoroughly before submitting. Practice more algorithmic logic fundamentals.'
    });
    if (avgE < 75) suggestions.push({
      title: 'Optimize Time & Space Complexity',
      text: 'Your solutions work but could be more efficient. Look into optimal data structures like HashMaps, Heaps, or try Dynamic Programming.'
    });
    if (avgEx < 75) suggestions.push({
      title: 'Enhance Communication & Explanations',
      text: 'Try to structure your thoughts clearly. Explicitly state the approach, time complexity, and space complexity.'
    });
    if (avgB < 75) suggestions.push({
      title: 'Strengthen Behavioral Answers',
      text: 'Use the STAR method (Situation, Task, Action, Result) to clearly demonstrate your experiences, ownership, and collaborative qualities.'
    });

    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Outstanding Performance!',
        text: 'You performed exceptionally well across all categories. Keep sharpening your skills.'
      });
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Score */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#2d3748"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(overallScore / 100) * 440} 440`}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5a7cff" />
                    <stop offset="100%" stopColor="#9b88ff" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-5xl font-bold text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text">
                  {overallScore.toString()}
                </span>
                <span className="text-sm text-gray-400">/ 100</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              <CheckCircle className="text-success" size={32} />
              Interview Completed!
            </h1>
            <p className="text-gray-400">Great job! Here's your measured performance breakdown on our platform</p>
          </div>

          <Link to="/dashboard">
            <Button size="lg" className="gap-2">
              <TrendingUp size={20} />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Performance Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {performanceData.map((item, idx) => (
            <Card key={idx} glass>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">{item.category}</p>
                <p className="text-4xl font-bold mb-2">{item.value}%</p>
                <div className="w-full bg-surface rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}

          {/* Test Case Count */}
          <Card glass className="md:col-span-3 bg-gradient-to-r from-success/10 to-primary/10 border-success/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-success">Hidden Test Cases Passed</h3>
                  <p className="text-sm text-gray-400">This includes all system evaluation test cases.</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-success">{totalPassedTestcases}</span>
                  <span className="text-xl text-gray-400"> / {totalAllTestcases}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Radar */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={feedbackData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f2e',
                      border: '1px solid #5a7cff',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#5a7cff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Round Breakdown */}
          <Card glass>
            <CardHeader>
              <CardTitle>Score Influences</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Personalized Suggestions Area */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="text-warning" size={24} />
            Personalized Suggestions
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {suggestions.map((s, idx) => (
              <Card key={idx} glass className="border-l-4 border-l-warning">
                <CardHeader>
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">{s.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/dashboard">
            <Button variant="outline">
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/interviews">
            <Button className="gap-2">
              Practice Another Interview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
