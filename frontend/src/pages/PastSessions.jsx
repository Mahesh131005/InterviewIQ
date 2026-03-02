import React, { useState, useEffect } from 'react'
import { Search, Filter, Download, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { interviews } from '../services/api'

export default function PastSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')

  // Pagination state
  const [page, setPage] = useState(0)
  const limit = 10
  const [hasMore, setHasMore] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const res = await interviews.getHistory(limit, page * limit)
        const newSessions = res.data.interviews || []
        if (newSessions.length < limit) {
          setHasMore(false)
        } else {
          setHasMore(true) // reset if we page back and forth
        }
        setSessions(newSessions)
      } catch (err) {
        console.error('Failed to load past sessions:', err)
        setError('Failed to load session history.')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [page])

  // Process the raw DB rows into UI-friendly shapes
  const processedSessions = sessions.map(session => {
    // Session has `questions_list` from the new SQL aggregation
    const questions = session.questions_list || []

    // Default to 'Multiple', 'Mixed' if there's more than one Question in the session
    let problemName = questions.length === 1 ? questions[0].title : (questions.length > 1 ? `${questions[0].title} (+${questions.length - 1} more)` : 'Interview Session')

    // Try to derive the overall difficulty, default to Mixed or whatever the first question was
    let difficulty = 'Mixed'
    if (questions.length > 0) {
      difficulty = questions[0].difficulty
    }

    let topic = 'General'
    if (questions.length > 0) {
      topic = questions[0].topic
    }

    return {
      id: session.id,
      problem: problemName,
      company: session.company_name,
      topic: topic,
      difficulty: difficulty,
      // Format timestamp natively for browser tz
      date: new Date(session.created_at).toLocaleDateString(),
      time: new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: Math.round(session.overall_score * 100),
      duration: session.completed_at ? Math.round((new Date(session.completed_at) - new Date(session.created_at)) / 60000) + 'm' : 'In Progress'
    }
  })

  // Offline filtering on current page elements
  const filtered = processedSessions.filter(session => {
    const matchesSearch = session.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.topic.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDifficulty = filterDifficulty === 'all' || session.difficulty.toLowerCase() === filterDifficulty.toLowerCase()

    return matchesSearch && matchesDifficulty
  })

  const getDifficultyColor = (difficulty) => {
    const d = difficulty?.toLowerCase()
    switch (d) {
      case 'easy': return 'bg-success/20 text-success'
      case 'medium': return 'bg-warning/20 text-warning'
      case 'hard': return 'bg-danger/20 text-danger'
      case 'mixed': return 'bg-primary/20 text-primary'
      default: return 'bg-primary/20 text-primary'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-danger'
  }

  // Handle Export to CSV Feature (client-side generation)
  const handleExport = () => {
    if (processedSessions.length === 0) return;
    const headers = ['ID', 'Problem', 'Company', 'Topic', 'Difficulty', 'Date', 'Time', 'Duration', 'Score'];
    const rows = processedSessions.map(s => [
      s.id, `"${s.problem}"`, `"${s.company}"`, `"${s.topic}"`, s.difficulty, s.date, s.time, s.duration, `${s.score}%`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(',') + "\n"
      + rows.map(r => r.join(',')).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "interview_sessions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Past Sessions</h1>
          <p className="text-gray-400">Review your interview history and track your progress</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-danger/10 border border-danger/50 text-danger rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search problems, companies, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Mixed">Mixed</option>
          </select>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download size={18} />
            Export CSV
          </Button>
        </div>

        {/* Sessions Table */}
        <Card glass className="overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="px-6 py-4 text-left text-sm font-bold">Problem(s)</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Topic</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Difficulty</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                      Loading session history...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((session) => (
                    <tr key={session.id} className="border-b border-border hover:bg-surface-light transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-white">{session.problem}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{session.company}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{session.topic}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(session.difficulty)}`}>
                          {session.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {session.date} <span className="text-gray-500">at {session.time}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{session.duration}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${getScoreColor(session.score)}`}>
                          {session.duration === 'In Progress' ? '--' : `${session.score}%`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-primary hover:text-primary-light"
                          onClick={() => navigate('/result', { state: { interviewId: session.id } })}
                          disabled={session.duration === 'In Progress'}
                        >
                          <Eye size={16} />
                          View Full Report
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                      No matching sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && (
            <div className="flex items-center justify-between p-4 border-t border-border bg-surface/30">
              <p className="text-sm text-gray-400">
                Showing page {page + 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft size={16} /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                >
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
