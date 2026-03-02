import React, { useState, useEffect } from 'react'
import { TrendingUp, Target, Zap, Award, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { analytics as analyticsApi } from '../services/api' // import api endpoint

const COLORS = ['#5a7cff', '#9b88ff', '#ff9580']

export default function Analytics() {
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
        setError('Failed to load analytics data.')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-background flex justify-center items-center text-white">Loading Analytics...</div>
  }

  const stats = analytics?.overall_stats || { total_interviews: 0, average_score: 0, trend: 0 }
  const totalInterviewsStr = stats.total_interviews.toString()
  // Mock 'Total Problems' as total_interviews * 3 for demo 
  const problemsSolvedStr = (stats.total_interviews * 3).toString()
  const avgScoreStr = `${Math.round(stats.average_score * 100)}%`
  const streakDaysStr = (stats.total_interviews > 0 ? '1' : '0') // Mocked streak
  const rankStr = stats.total_interviews > 5 ? '#342' : 'Unranked' // Mocked rank

  // Map backend history to weekly chart
  const weeklyData = (analytics?.score_history || []).map((h, i) => {
    const d = new Date(h.timestamp)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return {
      day: dayNames[d.getDay()],
      score: Math.round(h.score * 100),
      solved: 3 // mock solved count per session
    }
  }).reverse();

  // Map topic performance to category chart
  const categoryData = (analytics?.topic_performance || []).map(tp => ({
    category: tp.topic,
    solved: tp.attempts,
    mastery: Math.round(tp.avg_score * 100)
  }));

  // Fallback for difficulty since backend doesn't provide it yet
  const difficultyData = [
    { name: 'Easy', value: Math.round((stats.total_interviews * 3) * 0.5) || 1 },
    { name: 'Medium', value: Math.round((stats.total_interviews * 3) * 0.3) || 1 },
    { name: 'Hard', value: Math.round((stats.total_interviews * 3) * 0.2) || 1 },
  ]


  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics & Performance</h1>
          <p className="text-gray-400">Track your progress and identify areas for improvement</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-danger/10 border border-danger/50 text-danger rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card glass>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Total Problems</p>
                <p className="text-3xl font-bold">{problemsSolvedStr}</p>
                <p className="text-xs text-success mt-2">↑ Active</p>
              </div>
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                <Target size={20} />
              </div>
            </div>
          </Card>

          <Card glass>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Current Streak</p>
                <p className="text-3xl font-bold">{streakDaysStr} days</p>
                <p className="text-xs text-warning mt-2">Keep it going!</p>
              </div>
              <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center text-secondary">
                <Zap size={20} />
              </div>
            </div>
          </Card>

          <Card glass>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Average Score</p>
                <p className="text-3xl font-bold">{avgScoreStr}</p>
                <p className={`text-xs mt-2 ${stats.trend > 0 ? 'text-success' : 'text-danger'}`}>
                  {stats.trend > 0 ? '↑' : ''} {Math.round(stats.trend * 100)}% vs last session
                </p>
              </div>
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
                <TrendingUp size={20} />
              </div>
            </div>
          </Card>

          <Card glass>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Rank</p>
                <p className="text-3xl font-bold">{rankStr}</p>
                <p className="text-xs text-primary mt-2">Global Ranking</p>
              </div>
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center text-success">
                <Award size={20} />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Trend */}
          <Card glass>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1f2e',
                        border: '1px solid #5a7cff',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" name="Score %" dataKey="score" stroke="#5a7cff" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded">
                  Complete an interview to see your progress chart!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Problems by Difficulty */}
          <Card glass>
            <CardHeader>
              <CardTitle>Problems by Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.total_interviews > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded">
                  No problems solved yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Performance */}
        <Card glass className="mb-8">
          <CardHeader>
            <CardTitle>Category Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="category" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f2e',
                      border: '1px solid #5a7cff',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="solved" fill="#5a7cff" name="Problems Attempted" />
                  <Bar dataKey="mastery" fill="#9b88ff" name="Mastery %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded">
                No topic data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Category Stats */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card glass>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="space-y-4">
                  {categoryData.map((cat, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-sm text-gray-400">{cat.solved} problems</span>
                      </div>
                      <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-full"
                          style={{ width: `${cat.mastery}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">{cat.mastery}% mastery</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No categories practiced yet.</p>
              )}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle>Time Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Average Solution Time</p>
                  <p className="font-bold">18 min</p>
                </div>
                <div className="text-xs text-gray-400">Tracking coming soon</div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Total Practice Time</p>
                  <p className="font-bold">{stats.total_interviews > 0 ? `${Math.round((stats.total_interviews * 18) / 60)} hrs` : '0 hrs'}</p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Most Active Topic</p>
                  <p className="font-bold">
                    {categoryData.length > 0 ? categoryData.reduce((prev, current) => (prev.solved > current.solved) ? prev : current).category : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
