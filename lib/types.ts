export type Repo = {
  name: string
  description: string | null
  language: string | null
  pushedAt: string
  updatedAt: string
  stars: number
  forks: number
  openIssues: number
  branch: string
  url: string
  homepage: string | null
  hasActions: boolean
}

export type Run = {
  id: number
  repo: string
  workflow: string
  branch: string
  event: string
  status: 'queued' | 'in_progress' | 'completed' | string
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral' | null | string
  createdAt: string
  durationMs: number | null
  sha: string
  url: string
  actor: string | null
}

export type ActivityItem = {
  id: string
  kind: 'run' | 'push'
  repo: string
  title: string
  detail: string
  at: string
  conclusion: string | null
  url: string
}

export type StudioStats = {
  repos: number
  activeRepos: number
  runs30d: number
  buildMinutes30d: number
  successRate: number | null
  deployments30d: number
  languages: { name: string; count: number }[]
}

export type StudioData = {
  generatedAt: string
  account: { login: string; name: string | null; url: string }
  stats: StudioStats
  repos: Repo[]
  deployments: Run[]
  activity: ActivityItem[]
  source: { repos: string; runs: string; rateLimitRemaining: number | null; rateLimitLimit: number | null }
  warnings: string[]
}
