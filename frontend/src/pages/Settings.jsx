import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, LogOut, Bell, Shield, User, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'

export default function Settings() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notifications: true,
    dailyReminder: true,
  })
  const [saved, setSaved] = useState(false)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <div className="flex gap-3">
                <Button onClick={handleSave} className="gap-2 flex-1">
                  <Save size={18} />
                  {saved ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <span>Enable notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="dailyReminder"
                  checked={formData.dailyReminder}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <span>Daily practice reminder</span>
              </label>
              <p className="text-sm text-gray-400">Receive reminders to stay consistent with your practice</p>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon size={20} />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-gray-400">Currently {isDark ? 'enabled' : 'disabled'}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={toggleTheme}
                    className="w-0 h-0 opacity-0"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${
                    isDark ? 'bg-primary' : 'bg-surface-light'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      isDark ? 'translate-x-5' : ''
                    }`} />
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Active Sessions
              </Button>
              <p className="text-xs text-gray-400 mt-4">Keep your account secure by regularly updating your password and enabling two-factor authentication.</p>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card glass>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Download Your Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Data Usage Statistics
              </Button>
              <p className="text-xs text-gray-400 mt-4">Your data is encrypted and never shared with third parties. <span className="text-primary cursor-pointer hover:underline">Learn more</span></p>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card glass className="border-danger/30 bg-danger/5">
            <CardHeader>
              <CardTitle className="text-danger">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="danger" className="w-full gap-2">
                Delete Account
              </Button>
              <Button 
                variant="danger" 
                className="w-full gap-2"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Sign Out
              </Button>
              <p className="text-xs text-gray-400 mt-4">Signing out will end your current session. Deleting your account is permanent and cannot be undone.</p>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card glass>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Documentation & FAQ
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Contact Support
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Report a Bug
              </Button>
              <p className="text-xs text-gray-400 mt-4">Can't find what you're looking for? <span className="text-primary cursor-pointer hover:underline">Contact our support team</span></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
