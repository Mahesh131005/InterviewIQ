import React from 'react'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const base = [
    'inline-flex items-center justify-center gap-2 font-semibold',
    'transition-all duration-200 ease-out cursor-pointer select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
    'rounded-[--radius]',
  ].join(' ')

  const variants = {
    primary: [
      'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)]',
      'text-[var(--background)] shadow-md hover:shadow-lg',
      'hover:-translate-y-0.5 hover:brightness-110',
      'focus-visible:ring-[var(--primary)]',
      'active:translate-y-0 active:brightness-95',
    ].join(' '),

    secondary: [
      'bg-[var(--surface-light)] text-[var(--foreground)]',
      'border border-[var(--border)] hover:bg-[var(--surface-hover)]',
      'hover:border-[var(--primary)] hover:-translate-y-0.5',
      'focus-visible:ring-[var(--primary)]',
    ].join(' '),

    outline: [
      'border border-[var(--primary)] text-[var(--primary)] bg-transparent',
      'hover:bg-[var(--primary)] hover:text-[var(--background)]',
      'hover:-translate-y-0.5',
      'focus-visible:ring-[var(--primary)]',
    ].join(' '),

    ghost: [
      'text-[var(--foreground)] bg-transparent hover:bg-[var(--surface-light)]',
      'hover:text-[var(--accent)]',
      'focus-visible:ring-[var(--primary)]',
    ].join(' '),

    danger: [
      'bg-gradient-to-r from-[var(--danger)] to-rose-700',
      'text-white shadow-md hover:shadow-lg',
      'hover:-translate-y-0.5 hover:brightness-110',
      'focus-visible:ring-[var(--danger)]',
    ].join(' '),

    success: [
      'bg-gradient-to-r from-emerald-600 to-emerald-700',
      'text-white shadow-md hover:shadow-lg',
      'hover:-translate-y-0.5 hover:brightness-110',
      'focus-visible:ring-emerald-500',
    ].join(' '),
  }

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs rounded-lg',
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
