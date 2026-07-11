import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Code, Brain, Zap, TrendingUp, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { analytics as analyticsApi } from '../services/api' // import api endpoint

export default function Dashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsApi.getUserAnalytics()
        setAnalytics(res.data.analytics)
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-background flex justify-center items-center text-white">Loading Dashboard...</div>
  }

  // Derive stats from backend metrics
  const stats = analytics?.overall_stats || { total_interviews: 0, average_score: 0, trend: 0 }
  const totalInterviewsStr = stats.total_interviews.toString()
  // Mock 'Problems Solved' as total_interviews * 3 for demo purposes if no distinct counts exist, or just use interviews
  const problemsSolvedStr = (stats.total_interviews * 3).toString()
  const avgScoreStr = `${Math.round(stats.average_score * 100)}%`
  // We don't track Streak Days natively yet, so leaving a mock or deriving from history
  const streakDaysStr = (stats.total_interviews > 0 ? '1' : '0')

  const quickStats = [
    { label: 'Problems Solved', value: problemsSolvedStr, icon: Code, color: 'from-primary to-secondary' },
    { label: 'Interviews', value: totalInterviewsStr, icon: Brain, color: 'from-secondary to-accent' },
    { label: 'Streak Days', value: streakDaysStr, icon: Zap, color: 'from-accent to-primary' },
    { label: 'Avg Score', value: avgScoreStr, icon: TrendingUp, color: 'from-success to-primary' },
  ]

  // Map backend history to chart format. Backend sends timestamps, we need short day names.
  const chartData = (analytics?.score_history || []).map((h, i) => {
    const d = new Date(h.timestamp)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return {
      day: dayNames[d.getDay()],
      score: Math.round(h.score * 100)
    }
  }).reverse(); // Most recent first from backend, map requires chronological

  // recentSessions isn't directly returned by this endpoint perfectly formatted, 
  // but we can map score_history or use mock if history is small
  const recentSessions = (analytics?.score_history || []).slice(0, 3).map((sh, idx) => ({
    id: idx,
    type: 'Interview Session',
    difficulty: 'Mixed', // Analytics endpoint doesn't break down difficulty per session yet
    date: new Date(sh.timestamp).toLocaleDateString(),
    score: Math.round(sh.score * 100)
  }));


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}!</h1>
          <p className="text-gray-400">Keep up your practice streak and improve your interview skills</p>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto p-4 mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-danger/20 text-danger rounded border border-danger">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* CTA Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to="/practice">
            <Card glass className="h-full hover:border-success transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Practice Problems</CardTitle>
                  <p className="text-sm text-gray-400 mt-2">Solve problems freely without timer</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-success to-primary rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Code size={24} />
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/setup">
            <Card glass className="h-full hover:border-primary transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Start Mock Interview</CardTitle>
                  <p className="text-sm text-gray-400 mt-2">Simulate real AI tech interviews</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Brain size={24} />
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/analytics">
            <Card glass className="h-full hover:border-secondary transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>View Analytics</CardTitle>
                  <p className="text-sm text-gray-400 mt-2">Track progress and identify strengths</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <TrendingUp size={24} />
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} glass>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                    <Icon size={20} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Progress Chart */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card glass className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1f2e',
                        border: '1px solid #5a7cff',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f8f9fa' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#5a7cff"
                      strokeWidth={2}
                      dot={{ fill: '#5a7cff', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded">
                  Complete an interview to see your progress chart!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Total Sessions</p>
                <p className="text-2xl font-bold">{totalInterviewsStr}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Best Score</p>
                <p className="text-2xl font-bold">
                  {analytics?.score_history?.length > 0
                    ? `${Math.round(Math.max(...analytics.score_history.map(s => s.score)) * 100)}%`
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Trend</p>
                <p className="text-2xl font-bold">
                  {stats.trend > 0 ? '+' : ''}{Math.round(stats.trend * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card glass>
          <CardHeader className="flex items-center justify-between mb-4">
            <CardTitle>Recent Sessions</CardTitle>
            <Link to="/past-sessions">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border hover:border-primary transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <div>
                        <p className="font-medium">{session.type}</p>
                        <p className="text-sm text-gray-400">{session.difficulty} · {session.date}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${session.score >= 80 ? 'text-success' : session.score >= 60 ? 'text-warning' : 'text-danger'}`}>
                      {session.score}%
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No recent sessions available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

