import React from 'react'

export function Card({ children, className = '', glass = false }) {
  const classes = `rounded-lg p-6 border border-border transition-all duration-200 ${
    glass 
      ? 'glass' 
      : 'bg-surface'
  } ${className}`
  
  return <div className={classes}>{children}</div>
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-2xl font-bold text-foreground ${className}`}>{children}</h3>
}

export function CardDescription({ children, className = '' }) {
  return <p className={`text-sm text-gray-400 ${className}`}>{children}</p>
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return <div className={`mt-6 flex gap-3 ${className}`}>{children}</div>
}
