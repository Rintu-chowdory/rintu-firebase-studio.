export function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function duration(ms: number | null): string {
  if (!ms || ms < 0) return '—'
  const total = Math.round(ms / 1000)
  if (total < 60) return `${total}s`
  const minutes = Math.floor(total / 60)
  if (minutes < 60) return `${minutes}m ${String(total % 60).padStart(2, '0')}s`
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

export const LANGUAGE_COLOR: Record<string, string> = {
  TypeScript: '#6eafff',
  JavaScript: '#f6d365',
  Python: '#52d49a',
  HTML: '#f97362',
  CSS: '#a78bfa',
  Shell: '#9ee37d',
  Dockerfile: '#7cc7ff',
  Java: '#e08b5a',
  Go: '#5ad2d2',
  default: '#8993a7',
}

export function languageColor(language: string | null): string {
  if (!language) return LANGUAGE_COLOR.default
  return LANGUAGE_COLOR[language] ?? LANGUAGE_COLOR.default
}

export const STATUS_TONE: Record<string, { color: string; label: string }> = {
  success: { color: 'var(--green)', label: 'Success' },
  failure: { color: '#f2647c', label: 'Failed' },
  cancelled: { color: 'var(--muted)', label: 'Cancelled' },
  skipped: { color: 'var(--muted)', label: 'Skipped' },
  neutral: { color: 'var(--amber)', label: 'Neutral' },
  in_progress: { color: 'var(--blue)', label: 'Running' },
  queued: { color: 'var(--amber)', label: 'Queued' },
}

export function statusTone(status: string, conclusion: string | null) {
  if (conclusion && STATUS_TONE[conclusion]) return STATUS_TONE[conclusion]
  if (STATUS_TONE[status]) return STATUS_TONE[status]
  return { color: 'var(--muted)', label: status }
}
