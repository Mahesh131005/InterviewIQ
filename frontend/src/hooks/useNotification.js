import { useState, useCallback } from 'react'

export function useNotification() {
  const [notification, setNotification] = useState(null)

  const show = useCallback((message, type = 'info', duration = 3000) => {
    setNotification({ message, type })
    
    if (duration > 0) {
      setTimeout(() => {
        setNotification(null)
      }, duration)
    }
  }, [])

  const success = useCallback((message) => show(message, 'success'), [show])
  const error = useCallback((message) => show(message, 'error'), [show])
  const info = useCallback((message) => show(message, 'info'), [show])
  const warning = useCallback((message) => show(message, 'warning'), [show])

  const close = useCallback(() => setNotification(null), [])

  return {
    notification,
    show,
    success,
    error,
    info,
    warning,
    close,
  }
}
