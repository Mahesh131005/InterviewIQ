import React from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'bg-success/10 border-success/30 text-success',
  error: 'bg-danger/10 border-danger/30 text-danger',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  info: 'bg-primary/10 border-primary/30 text-primary',
}

export function Notification({ message, type = 'info', onClose }) {
  if (!message) return null

  const Icon = icons[type] || icons.info
  const colorClass = colors[type] || colors.info

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${colorClass} animate-fade-in`}>
      <Icon size={20} className="flex-shrink-0" />
      <p className="flex-1">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X size={20} />
      </button>
    </div>
  )
}

export function NotificationContainer({ notification, onClose }) {
  if (!notification) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={onClose}
      />
    </div>
  )
}
