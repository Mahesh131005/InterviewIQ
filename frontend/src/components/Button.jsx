import React from 'react'

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  disabled = false,
  ...props 
}) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2'
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark disabled:opacity-50',
    secondary: 'bg-secondary text-white hover:bg-opacity-90 disabled:opacity-50',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50',
    ghost: 'text-primary hover:bg-surface disabled:opacity-50',
    danger: 'bg-danger text-white hover:bg-opacity-90 disabled:opacity-50',
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return (
    <button 
      className={classes} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
