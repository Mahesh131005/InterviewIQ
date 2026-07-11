import React from 'react'

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground opacity-80">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 flex items-center justify-center opacity-40 text-foreground pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          className={[
            'shadcn-input w-full px-4 py-2.5 text-sm',
            'placeholder:opacity-30 placeholder:text-foreground',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            error
              ? 'border-[var(--danger)] focus:ring-[var(--danger)]/20'
              : '',
            className,
          ].join(' ')}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 flex items-center justify-center opacity-40 text-foreground pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>

      {hint && !error && (
        <p className="text-xs opacity-40 text-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--danger)] flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

export function Textarea({ label, error, hint, className = '', ...props }) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground opacity-80">
          {label}
        </label>
      )}
      <textarea
        className={[
          'shadcn-input w-full px-4 py-3 text-sm resize-none',
          'placeholder:opacity-30 placeholder:text-foreground',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          error ? 'border-[var(--danger)]' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs opacity-40 text-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--danger)] flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

export function Select({ label, error, hint, className = '', children, ...props }) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground opacity-80">
          {label}
        </label>
      )}
      <select
        className={[
          'shadcn-input w-full px-4 py-2.5 text-sm appearance-none cursor-pointer',
          error ? 'border-[var(--danger)]' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {hint && !error && (
        <p className="text-xs opacity-40 text-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--danger)]">⚠ {error}</p>
      )}
    </div>
  )
}
