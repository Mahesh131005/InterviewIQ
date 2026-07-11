import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { InterviewGuardProvider } from './context/InterviewGuardContext'
import { Layout } from './components/Layout'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CodingInterview from './pages/CodingInterview'
import ExplanationSubmission from './pages/ExplanationSubmission'
import BehavioralRound from './pages/BehavioralRound'
import Result from './pages/Result'
import PastSessions from './pages/PastSessions'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import InterviewSetup from './pages/InterviewSetup'
import FollowUpRound from './pages/FollowUpRound'
import PracticeList from './pages/PracticeList'
import ProblemDetail from './pages/ProblemDetail'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppContent() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  return (
    <Layout>
      <Routes>
        <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/setup" element={<PrivateRoute><InterviewSetup /></PrivateRoute>} />
        <Route path="/interviews" element={<PrivateRoute><CodingInterview /></PrivateRoute>} />
        <Route path="/explanation" element={<PrivateRoute><ExplanationSubmission /></PrivateRoute>} />
        <Route path="/follow-up" element={<PrivateRoute><FollowUpRound /></PrivateRoute>} />
        <Route path="/behavioral" element={<PrivateRoute><BehavioralRound /></PrivateRoute>} />
        <Route path="/result" element={<PrivateRoute><Result /></PrivateRoute>} />
        <Route path="/past-sessions" element={<PrivateRoute><PastSessions /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/practice" element={<PrivateRoute><PracticeList /></PrivateRoute>} />
        <Route path="/practice/:id" element={<PrivateRoute><ProblemDetail /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InterviewGuardProvider>
          <AppContent />
        </InterviewGuardProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
