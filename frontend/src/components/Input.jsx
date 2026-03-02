import React from 'react'

export function Input({ 
  label, 
  error, 
  className = '',
  ...props 
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 rounded-lg bg-surface border border-border text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${className}`}
        {...props}
      />
      {error && (
        <p className="text-danger text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
