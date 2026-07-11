import React from 'react'

/* ──────────────────────────────────────────────
   Card — shadcn-quality, picks up CSS variables
   Works in both Coutts dark & Harness light mode
   ────────────────────────────────────────────── */
export function Card({ children, className = '', glass = false, hover = true }) {
  return (
    <div
      className={[
        'shadcn-card p-6',
        hover ? 'hover:translate-y-[-1px]' : '',
        glass ? 'glass' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 space-y-1 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold leading-tight tracking-tight text-foreground ${className}`}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm leading-relaxed opacity-60 text-foreground ${className}`}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border-subtle)] ${className}`}>
      {children}
    </div>
  )
}

/* Stat card used in dashboards */
export function StatCard({ label, value, icon, trend, className = '' }) {
  return (
    <div className={`shadcn-card p-5 flex flex-col gap-3 ${className}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-widest opacity-50 text-foreground">{label}</p>
        {icon && (
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,150,60,0.12)', color: 'var(--accent)' }}>
            {icon}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {trend !== undefined && (
        <p className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
        </p>
      )}
    </div>
  )
}

/* Section label / divider */
export function CardSection({ title, children, className = '' }) {
  return (
    <div className={className}>
      {title && (
        <p className="text-xs font-semibold uppercase tracking-widest opacity-40 text-foreground mb-3">
          {title}
        </p>
      )}
      {children}
    </div>
  )
}
