import React, { useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, X, LogOut, Settings, Moon, Sun,
  LayoutDashboard, Code2, PlayCircle, History, BarChart3,
  AlertTriangle, Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useInterviewGuard } from '../context/InterviewGuardContext'
import { interviews } from '../services/api'

const navItems = [
  { label: 'Dashboard',       path: '/dashboard',     icon: LayoutDashboard },
  { label: 'Practice',        path: '/practice',      icon: Code2 },
  { label: 'Interview Setup', path: '/setup',         icon: PlayCircle },
  { label: 'Past Sessions',   path: '/past-sessions', icon: History },
  { label: 'Analytics',       path: '/analytics',     icon: BarChart3 },
]

/* ── Nav Guard Confirmation Modal ─────────────────────────────────── */
function NavGuardModal({ targetPath, onConfirm, onCancel, isSaving }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div
        className="shadcn-card w-full max-w-md p-6 animate-fade-in"
        style={{ background: 'var(--surface)' }}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4"
          style={{ background: 'rgba(200,150,60,0.15)' }}>
          <AlertTriangle size={24} style={{ color: 'var(--primary)' }} />
        </div>

        <h2 className="text-lg font-bold text-center text-foreground mb-2">
          Leave Interview?
        </h2>
        <p className="text-sm text-center opacity-60 text-foreground mb-6">
          Your interview is still in progress. If you leave now, your score will be
          calculated based on what you've done so far and saved automatically.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 py-2.5 text-sm font-semibold rounded-[--radius] border transition-all disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Stay in Interview
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className="flex-1 py-2.5 text-sm font-semibold rounded-[--radius] flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: 'var(--background)',
            }}
          >
            {isSaving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving score...</>
            ) : (
              'Yes, Leave & Save'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Layout ──────────────────────────────────────────────────── */
export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [guardPending, setGuardPending] = useState(null)   // { targetPath }
  const [isSaving, setIsSaving]       = useState(false)

  const location  = useLocation()
  const navigate  = useNavigate()
  const { user, logout }             = useAuth()
  const { isDark, toggleTheme }      = useTheme()
  const { activeInterviewId, clearActiveInterview } = useInterviewGuard()

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => location.pathname === path
  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname)

  /* Intercept a nav click — show guard if interview is active */
  const handleNavClick = useCallback((e, path) => {
    if (activeInterviewId && location.pathname === '/interviews') {
      e.preventDefault()
      setGuardPending({ targetPath: path })
    }
    // else let the <Link> navigate normally
  }, [activeInterviewId, location.pathname])

  /* User confirmed leaving — save score then navigate */
  const handleGuardConfirm = async () => {
    if (!guardPending) return
    setIsSaving(true)
    try {
      await interviews.complete(activeInterviewId)
    } catch (err) {
      console.error('Failed to complete interview on leave:', err)
    } finally {
      clearActiveInterview()
      // Clear session cache so next visit starts fresh
      sessionStorage.removeItem('currentInterviewId')
      sessionStorage.removeItem('currentProblem')
      sessionStorage.removeItem('interviewTimeLeft')
      sessionStorage.removeItem('currentTopic')
      setIsSaving(false)
      const target = guardPending.targetPath
      setGuardPending(null)
      navigate(target)
    }
  }

  const handleGuardCancel = () => setGuardPending(null)

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">

      {/* ── NAV GUARD MODAL ───────────────────────────────────────── */}
      {guardPending && (
        <NavGuardModal
          targetPath={guardPending.targetPath}
          onConfirm={handleGuardConfirm}
          onCancel={handleGuardCancel}
          isSaving={isSaving}
        />
      )}

      {/* ── TOP NAVBAR ────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-14"
        style={{
          background: 'var(--navbar-bg)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 1px 0 rgba(200,150,60,0.06)',
        }}
      >
        <div className="flex items-center justify-between h-full px-4 md:px-6 max-w-screen-2xl mx-auto">
          {/* Left — logo + mobile toggle */}
          <div className="flex items-center gap-3">
            {user && !isPublicPage && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-surface-light transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: 'var(--background)',
                  boxShadow: '0 0 12px rgba(200,150,60,0.4)',
                }}
              >
                IQ
              </div>
              <span className="font-semibold text-sm hidden sm:inline tracking-tight text-foreground">
                InterviewIQ
              </span>
            </Link>

            {/* Interview in progress badge */}
            {activeInterviewId && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(200,150,60,0.15)', color: 'var(--accent)', border: '1px solid rgba(200,150,60,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Interview in progress
              </span>
            )}
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-surface-light transition-colors text-foreground opacity-60 hover:opacity-100"
              title={isDark ? 'Switch to light' : 'Switch to dark'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user && (
              <>
                <Link to="/settings"
                  className="p-2 rounded-lg hover:bg-surface-light transition-colors text-foreground opacity-60 hover:opacity-100 hidden sm:flex"
                  title="Settings"
                >
                  <Settings size={18} />
                </Link>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-1 hidden sm:flex shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'var(--background)' }}
                  title={user.name}
                >
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-surface-light transition-colors text-foreground opacity-60 hover:opacity-100"
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── PAGE BODY ─────────────────────────────────────────────── */}
      <div className="flex pt-14 min-h-screen">

        {/* ── SIDEBAR ───────────────────────────────────────────── */}
        {user && !isPublicPage && (
          <>
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/60 md:hidden z-40 mt-14 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            <aside
              className={[
                'fixed md:sticky top-14 left-0 h-[calc(100vh-3.5rem)]',
                'w-56 shrink-0 z-40 flex flex-col',
                'transform transition-transform duration-300 ease-in-out',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
              ].join(' ')}
              style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}
            >
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                {navItems.map(({ label, path, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={(e) => {
                      handleNavClick(e, path)
                      setSidebarOpen(false)
                    }}
                    className={`shadcn-nav-item ${isActive(path) ? 'active' : ''}`}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              {user && (
                <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3 px-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'var(--background)' }}
                    >
                      {user.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-xs opacity-40 text-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </>
        )}

        {/* ── MAIN CONTENT ──────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
