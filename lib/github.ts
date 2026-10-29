import type { ActivityItem, Repo, Run, StudioData, StudioStats } from './types'

/**
 * All dashboard numbers come from the public GitHub REST API.
 *
 * No secret is required: the repo list and Actions runs of public repositories are
 * readable anonymously. When GITHUB_TOKEN is present the same code uses it, which only
 * lifts the rate limit from 60 to 5000 requests per hour.
 *
 * Every response is cached by Next's fetch cache (`next.revalidate`), so a busy dashboard
 * still costs a handful of upstream calls per refresh window instead of one per visitor.
 */

const OWNER = process.env.STUDIO_OWNER || 'Rintu-chowdory'
const API = 'https://api.github.com'

// Repos are ranked by last push and only the busiest few get their runs fetched, which
// keeps one refresh at ~1 + N requests instead of one per repository.
const RUN_SAMPLE = Number(process.env.STUDIO_RUN_SAMPLE || 8)
const REPO_TTL = 300
const RUN_TTL = 180

const DEPLOY_PATTERN = /deploy|pages|vercel|publish|release|docker/i

function baseHeaders(): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function headers(): HeadersInit {
  const base = baseHeaders()
  if (process.env.GITHUB_TOKEN) base.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return base
}

// A stale or revoked token must not take the whole dashboard down. When GitHub rejects
// the credential we drop it and finish the request anonymously instead.
let tokenRejected = false

type RateLimit = { remaining: number | null; limit: number | null }

async function gh<T>(path: string, revalidate: number, rate: RateLimit): Promise<T> {
  const url = `${API}${path}`
  let res = await fetch(url, {
    headers: tokenRejected ? baseHeaders() : headers(),
    next: { revalidate },
  })

  if ((res.status === 401 || res.status === 403) && process.env.GITHUB_TOKEN && !tokenRejected) {
    tokenRejected = true
    res = await fetch(url, { headers: baseHeaders(), next: { revalidate } })
  }

  const remaining = res.headers.get('x-ratelimit-remaining')
  const limit = res.headers.get('x-ratelimit-limit')
  if (remaining) rate.remaining = Number(remaining)
  if (limit) rate.limit = Number(limit)

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub ${res.status} on ${path}: ${body.slice(0, 120)}`)
  }
  return res.json() as Promise<T>
}

type RawRepo = {
  name: string
  description: string | null
  language: string | null
  pushed_at: string
  updated_at: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  html_url: string
  homepage: string | null
  has_actions?: boolean
  archived: boolean
  fork: boolean
}

type RawRun = {
  id: number
  name: string
  head_branch: string
  event: string
  status: string
  conclusion: string | null
  created_at: string
  run_started_at: string | null
  updated_at: string
  head_sha: string
  html_url: string
  actor: { login: string } | null
  repository?: { name: string }
}

const durationMs = (run: RawRun): number | null => {
  if (!run.run_started_at || !run.updated_at) return null
  const ms = new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime()
  return Number.isFinite(ms) && ms >= 0 ? ms : null
}

const toRun = (repo: string, raw: RawRun): Run => ({
  id: raw.id,
  repo,
  workflow: raw.name,
  branch: raw.head_branch,
  event: raw.event,
  status: raw.status,
  conclusion: raw.conclusion,
  createdAt: raw.created_at,
  durationMs: durationMs(raw),
  sha: raw.head_sha?.slice(0, 7) ?? '',
  url: raw.html_url,
  actor: raw.actor?.login ?? null,
})

function summarise(repos: Repo[], runs: Run[]): StudioStats {
  const since = Date.now() - 30 * 24 * 3600 * 1000
  const recent = runs.filter((r) => new Date(r.createdAt).getTime() >= since)
  const completed = recent.filter((r) => r.status === 'completed')
  const succeeded = completed.filter((r) => r.conclusion === 'success')
  const minutes = recent.reduce((sum, r) => sum + (r.durationMs ?? 0), 0) / 60000

  const languages = new Map<string, number>()
  for (const repo of repos) {
    if (!repo.language) continue
    languages.set(repo.language, (languages.get(repo.language) ?? 0) + 1)
  }

  return {
    repos: repos.length,
    activeRepos: repos.filter((r) => Date.now() - new Date(r.pushedAt).getTime() < 30 * 24 * 3600 * 1000)
      .length,
    runs30d: recent.length,
    buildMinutes30d: Math.round(minutes),
    successRate: completed.length ? Math.round((succeeded.length / completed.length) * 1000) / 10 : null,
    deployments30d: recent.filter((r) => DEPLOY_PATTERN.test(r.workflow)).length,
    languages: [...languages.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
  }
}

function buildActivity(runs: Run[], repos: Repo[]): ActivityItem[] {
  const fromRuns: ActivityItem[] = runs.map((run) => ({
    id: `run-${run.id}`,
    kind: 'run',
    repo: run.repo,
    title: run.workflow,
    detail: `${run.branch} · ${run.sha}${run.conclusion ? ` · ${run.conclusion}` : ` · ${run.status}`}`,
    at: run.createdAt,
    conclusion: run.conclusion,
    url: run.url,
  }))

  const recentPushes = repos
    .filter((repo) => Date.now() - new Date(repo.pushedAt).getTime() < 7 * 24 * 3600 * 1000)
    .slice(0, 6)
    .map((repo) => ({
      id: `push-${repo.name}`,
      kind: 'push' as const,
      repo: repo.name,
      title: 'Pushed to',
      detail: repo.branch,
      at: repo.pushedAt,
      conclusion: null,
      url: repo.url,
    }))

  return [...fromRuns, ...recentPushes]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 24)
}

export async function getStudioData(): Promise<StudioData> {
  const rate: RateLimit = { remaining: null, limit: null }
  const warnings: string[] = []

  const account = await gh<{ login: string; name: string | null; html_url: string }>(
    `/users/${OWNER}`,
    REPO_TTL,
    rate,
  )

  const rawRepos = await gh<RawRepo[]>(
    `/users/${OWNER}/repos?per_page=100&sort=pushed&direction=desc`,
    REPO_TTL,
    rate,
  )

  const repos: Repo[] = rawRepos.map((repo) => ({
    name: repo.name,
    description: repo.description,
    language: repo.language,
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    branch: repo.default_branch,
    url: repo.html_url,
    homepage: repo.homepage,
    hasActions: repo.has_actions ?? true,
  }))

  const sampled = repos.slice(0, RUN_SAMPLE)

  const perRepo = await Promise.all(
    sampled.map(async (repo) => {
      try {
        const data = await gh<{ workflow_runs: RawRun[] }>(
          `/repos/${OWNER}/${repo.name}/actions/runs?per_page=10`,
          RUN_TTL,
          rate,
        )
        return (data.workflow_runs ?? []).map((raw) => toRun(repo.name, raw))
      } catch (error) {
        warnings.push(
          `${repo.name}: ${error instanceof Error ? error.message : 'Actions runs unavailable'}`,
        )
        return [] as Run[]
      }
    }),
  )

  const runs = perRepo.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (tokenRejected) {
    warnings.push('GITHUB_TOKEN was rejected by GitHub; results are anonymous and rate limited.')
  }

  return {
    generatedAt: new Date().toISOString(),
    account: { login: account.login, name: account.name, url: account.html_url },
    stats: summarise(repos, runs),
    repos,
    deployments: runs.filter((run) => DEPLOY_PATTERN.test(run.workflow)).slice(0, 18),
    activity: buildActivity(runs, repos),
    source: {
      repos: `${API}/users/${OWNER}/repos`,
      runs: `${sampled.length} most recently pushed repositories`,
      rateLimitRemaining: rate.remaining,
      rateLimitLimit: rate.limit,
    },
    warnings,
  }
}
