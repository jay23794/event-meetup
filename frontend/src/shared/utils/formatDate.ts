function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime())
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '—'
  const d = new Date(date)
  if (!isValidDate(d)) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '—'
  const d = new Date(date)
  if (!isValidDate(d)) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date | undefined | null): string {
  if (!date) return '—'
  const d = new Date(date)
  if (!isValidDate(d)) return '—'
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return formatDate(d)
}
