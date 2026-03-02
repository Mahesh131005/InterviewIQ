import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, Settings, Moon, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Practice / Interview', path: '/setup' },
  { label: 'Past Sessions', path: '/past-sessions' },
  { label: 'Analytics', path: '/analytics' },
]

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-surface border-b border-border z-50">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-surface-light rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold">
                AI
              </div>
              <span className="font-bold text-lg hidden sm:inline text-foreground">Code Interviewer</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-surface-light rounded-lg transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user && (
              <>
                <Link
                  to="/settings"
                  className="p-2 hover:bg-surface-light rounded-lg transition-colors hidden sm:flex"
                >
                  <Settings size={20} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-surface-light rounded-lg transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar + Content */}
      <div className="flex pt-16">
        {/* Sidebar */}
        {user && (
          <>
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 md:hidden z-40 mt-16"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:relative left-0 top-16 h-screen md:h-auto w-64 bg-surface border-r border-border transform transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              }`}>
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`block px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                        ? 'bg-primary text-white'
                        : 'text-foreground hover:bg-surface-light'
                      }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
