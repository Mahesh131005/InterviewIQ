import React from 'react'

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`bg-surface animate-pulse rounded-lg ${className}`}
      style={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-surface rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
    </tr>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface rounded-lg p-6">
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-8 w-1/3" />
        </div>
      ))}
    </div>
  )
}
