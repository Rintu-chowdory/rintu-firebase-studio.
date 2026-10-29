'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  GitBranch,
  GitCommitHorizontal,
  Gauge,
  LayoutGrid,
  ListChecks,
  Menu,
  RefreshCw,
  Rocket,
  Search,
  Star,
  Timer,
  TriangleAlert,
  X,
} from 'lucide-react'
import type { ActivityItem, Repo, Run, StudioData } from '@/lib/types'
import { duration, languageColor, statusTone, timeAgo } from '@/lib/format'
import AgentPanel from './AgentPanel'

type Tab = 'overview' | 'deployments' | 'repos' | 'activity'

const TABS: { id: Tab; label: string; icon: typeof Gauge }[] = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'deployments', label: 'Deployments', icon: Rocket },
  { id: 'repos', label: 'Repositories', icon: LayoutGrid },
  { id: 'activity', label: 'Activity', icon: Activity },
]

function Stat({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  unit?: string
  sub: string
  icon: typeof Gauge
  tone: string
}) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={14} style={{ color: tone }} />
      </div>
      <div className="stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}

function RunRow({ run }: { run: Run }) {
  const tone = statusTone(run.status, run.conclusion)
  return (
    <a className="row" href={run.url} target="_blank" rel="noreferrer">
      <span className="dot" style={{ background: tone.color }} />
      <span className="row-main">
        <span className="row-title">
          {run.repo} <span style={{ color: 'var(--faint)' }}>·</span> {run.workflow}
        </span>
        <span className="row-sub">
          <GitBranch size={10} style={{ verticalAlign: -1, marginRight: 4 }} />
          {run.branch} · <span className="mini">{run.sha}</span> · {run.event}
        </span>
      </span>
      <span className="row-meta">
        <span style={{ color: tone.color }}>{tone.label}</span>
        <span>
          {duration(run.durationMs)} · {timeAgo(run.createdAt)}
        </span>
      </span>
    </a>
  )
}

function RepoCard({ repo, onOpen }: { repo: Repo; onOpen: () => void }) {
  return (
    <button className="repo-card" onClick={onOpen}>
      <h3>
        <span className="dot" style={{ background: languageColor(repo.language) }} />
        {repo.name}
      </h3>
      <p>{repo.description ?? 'No description yet.'}</p>
      <span className="repo-foot">
        <span>{repo.language ?? 'Unknown'}</span>
        <span>·</span>
        <span>{timeAgo(repo.pushedAt)}</span>
        {repo.stars > 0 && (
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Star size={10} /> {repo.stars}
          </span>
        )}
      </span>
    </button>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const tone = statusTone('completed', item.conclusion)
  const Icon = item.kind === 'push' ? GitCommitHorizontal : ListChecks
  return (
    <a className="row" href={item.url} target="_blank" rel="noreferrer">
      <span style={{ color: item.kind === 'push' ? 'var(--blue)' : tone.color, display: 'grid', placeItems: 'center' }}>
        <Icon size={13} />
      </span>
      <span className="row-main">
        <span className="row-title">
          {item.repo} <span style={{ color: 'var(--faint)' }}>·</span> {item.title}
        </span>
        <span className="row-sub">{item.detail}</span>
      </span>
      <span className="row-meta">
        <span>{timeAgo(item.at)}</span>
      </span>
    </a>
  )
}

function RepoDrawer({
  repo,
  runs,
  onClose,
}: {
  repo: Repo
  runs: Run[]
  onClose: () => void
}) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} role="presentation" />
      <div className="drawer" role="dialog" aria-label={`${repo.name} details`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="badge">
            <span className="dot" style={{ background: languageColor(repo.language) }} />
            {repo.language ?? 'Unknown'}
          </span>
          <button className="btn" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <h2>{repo.name}</h2>
        <p className="lead">{repo.description ?? 'No description on GitHub yet.'}</p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn" href={repo.url} target="_blank" rel="noreferrer">
            Open on GitHub <ArrowUpRight size={13} />
          </a>
          {repo.homepage && (
            <a className="btn" href={repo.homepage} target="_blank" rel="noreferrer">
              Live site <ArrowUpRight size={13} />
            </a>
          )}
        </div>

        <div className="meta-grid">
          <div className="meta-cell">
            <span>Default branch</span>
            <strong>{repo.branch}</strong>
          </div>
          <div className="meta-cell">
            <span>Last push</span>
            <strong>{timeAgo(repo.pushedAt)}</strong>
          </div>
          <div className="meta-cell">
            <span>Stars · forks</span>
            <strong>
              {repo.stars} · {repo.forks}
            </strong>
          </div>
          <div className="meta-cell">
            <span>Open issues</span>
            <strong>{repo.openIssues}</strong>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Recent workflow runs</h2>
            <span className="hint">{runs.length} shown</span>
          </div>
          <div className="card-body">
            {runs.length ? (
              runs.map((run) => <RunRow key={run.id} run={run} />)
            ) : (
              <div className="empty">
                No runs were collected for this repository. The overview samples the{' '}
                <em>most recently pushed</em> repositories to stay inside the GitHub rate limit.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function Studio({ initial }: { initial: StudioData }) {
  const [data, setData] = useState<StudioData>(initial)
  const [tab, setTab] = useState<Tab>('overview')
  const [query, setQuery] = useState('')
  const [runFilter, setRunFilter] = useState<'all' | 'success' | 'failure' | 'running'>('all')
  const [openRepo, setOpenRepo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const repos = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = needle
      ? data.repos.filter(
          (repo) =>
            repo.name.toLowerCase().includes(needle) ||
            (repo.description ?? '').toLowerCase().includes(needle) ||
            (repo.language ?? '').toLowerCase().includes(needle),
        )
      : data.repos
    return list
  }, [data.repos, query])

  const runs = useMemo(() => {
    const all = [...data.deployments]
    if (runFilter === 'all') return all
    if (runFilter === 'running') return all.filter((r) => r.status !== 'completed')
    return all.filter((r) => r.conclusion === runFilter)
  }, [data.deployments, runFilter])

  const runsByRepo = useMemo(() => {
    const map = new Map<string, Run[]>()
    for (const run of data.deployments) {
      const list = map.get(run.repo) ?? []
      list.push(run)
      map.set(run.repo, list)
    }
    return map
  }, [data.deployments])

  const selected = openRepo ? data.repos.find((repo) => repo.name === openRepo) ?? null : null
  const agentProject = openRepo ?? (tab === 'repos' ? 'your repositories' : 'the studio overview')

  async function refresh() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/studio', { cache: 'no-store' })
      const payload = (await res.json()) as StudioData & { error?: string; detail?: string }
      if (!res.ok) throw new Error(payload.detail || payload.error || `Request failed (${res.status})`)
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed')
    } finally {
      setBusy(false)
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = (data.account.name ?? data.account.login).split(' ')[0]

  return (
    <div className={`shell${tab === 'repos' ? '' : ''}`}>
      <div className="brandbar">
        <span className="logo">RS</span>
        <span className="brand-text">
          Rintu <span>Studio</span>
        </span>
        <span className="chip" style={{ marginLeft: 'auto' }}>
          live
        </span>
      </div>

      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button
            className="btn menu-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <Menu size={15} />
          </button>
          <div className="crumbs">
            <span>@{data.account.login.toLowerCase()}</span>
            <span>/</span>
            <strong>{tab}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-badge" title={`Data generated ${new Date(data.generatedAt).toLocaleString('en-GB')}`}>
            <span className={data.warnings.length ? 'pulse warn' : 'pulse'} />
            {data.warnings.length ? `${data.warnings.length} source warning` : `synced ${timeAgo(data.generatedAt)}`}
          </span>
          <button className="btn" onClick={refresh} disabled={busy}>
            <RefreshCw size={14} style={busy ? { animation: 'spin 1s linear infinite' } : undefined} />
            {busy ? 'Syncing' : 'Refresh'}
          </button>
        </div>
      </header>

      <nav className={menuOpen ? 'sidebar open' : 'sidebar'} aria-label="Navigation">
        <div>
          <div className="side-label">
            <span>Repositories</span>
            <span>{data.repos.length}</span>
          </div>
          <label className="search">
            <Search size={13} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter repositories"
              aria-label="Filter repositories"
            />
          </label>
          <div className="repo-list" style={{ marginTop: 8 }}>
            {repos.slice(0, 14).map((repo) => (
              <button
                key={repo.name}
                className={openRepo === repo.name ? 'repo-item active' : 'repo-item'}
                onClick={() => {
                  setOpenRepo(repo.name)
                  setMenuOpen(false)
                }}
              >
                <span className="repo-dot" style={{ background: languageColor(repo.language) }} />
                <span className="repo-name">{repo.name}</span>
                <span className="repo-age">{timeAgo(repo.pushedAt)}</span>
              </button>
            ))}
            {repos.length === 0 && <div className="empty">No repository matches “{query}”.</div>}
            {repos.length > 14 && (
              <button
                className="side-link"
                onClick={() => {
                  setTab('repos')
                  setMenuOpen(false)
                }}
              >
                <ArrowRight size={13} /> {repos.length - 14} more
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="side-label">
            <span>Workspace</span>
          </div>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? 'side-link active' : 'side-link'}
              onClick={() => {
                setTab(id)
                setOpenRepo(null)
                setMenuOpen(false)
              }}
            >
              <Icon size={14} />
              {label}
              {id === 'deployments' && <span className="side-count">{data.deployments.length}</span>}
              {id === 'repos' && <span className="side-count">{data.repos.length}</span>}
            </button>
          ))}
        </div>

        <div className="coverage">
          Every number here is read from the public GitHub API for{' '}
          <code>{data.account.login}</code>. Workflow runs are sampled from the{' '}
          {data.source.runs.replace(' repositories', '')} most recently pushed repositories.
          {data.source.rateLimitRemaining !== null && (
            <>
              {' '}
              Rate limit left: <code>{data.source.rateLimitRemaining}/{data.source.rateLimitLimit}</code>.
            </>
          )}
        </div>
      </nav>

      <main className="main">
        <div className="page-head">
          <div>
            <h1>
              {greeting}, {firstName}
              <em>.</em>
            </h1>
            <p>
              {data.stats.repos} public repositories, {data.stats.activeRepos} touched this month, and{' '}
              {data.stats.runs30d} workflow runs in the last 30 days.
            </p>
          </div>
          <a className="btn primary" href="https://github.com/new" target="_blank" rel="noreferrer">
            <Rocket size={14} />
            New repository
          </a>
        </div>

        {(error || data.warnings.length > 0) && (
          <div
            className="badge"
            style={{
              marginTop: 14,
              color: 'var(--amber)',
              borderColor: 'rgba(245,183,99,.3)',
              background: 'rgba(245,183,99,.08)',
              padding: '6px 10px',
              whiteSpace: 'normal',
              textAlign: 'left',
              lineHeight: 1.5,
            }}
            title={data.warnings.join('\n')}
          >
            <TriangleAlert size={12} style={{ flexShrink: 0 }} />
            {error ??
              (data.warnings.length > 1
                ? `${data.warnings[0]} (+${data.warnings.length - 1} more)`
                : data.warnings[0])}
          </div>
        )}

        <div className="tabs" role="tablist">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'tab active' : 'tab'}
              onClick={() => {
                setTab(id)
                setOpenRepo(null)
              }}
            >
              {label}
              {id === 'deployments' && <span className="count">{data.deployments.length}</span>}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="fade-in">
            <div className="stats">
              <Stat
                label="Repositories"
                value={String(data.stats.repos)}
                sub={`${data.stats.activeRepos} pushed in the last 30 days`}
                icon={Boxes}
                tone="var(--violet)"
              />
              <Stat
                label="Workflow runs"
                value={String(data.stats.runs30d)}
                sub={`${data.stats.deployments30d} deploy runs in 30 days`}
                icon={ListChecks}
                tone="var(--blue)"
              />
              <Stat
                label="Build time"
                value={String(data.stats.buildMinutes30d)}
                unit="min"
                sub="summed Actions runtime, 30 days"
                icon={Timer}
                tone="var(--amber)"
              />
              <Stat
                label="Success rate"
                value={data.stats.successRate === null ? '—' : String(data.stats.successRate)}
                unit={data.stats.successRate === null ? undefined : '%'}
                sub="completed runs, last 30 days"
                icon={Gauge}
                tone="var(--green)"
              />
            </div>

            <div className="columns">
              <section className="card">
                <div className="card-head">
                  <h2>Recent deployments</h2>
                  <button className="hint" onClick={() => setTab('deployments')} style={{ color: 'var(--violet)' }}>
                    View all
                  </button>
                </div>
                <div className="card-body">
                  {data.deployments.slice(0, 6).map((run) => (
                    <RunRow key={run.id} run={run} />
                  ))}
                  {data.deployments.length === 0 && (
                    <div className="empty">No deploy workflows ran in the sampled repositories.</div>
                  )}
                </div>
              </section>

              <section className="card">
                <div className="card-head">
                  <h2>Activity</h2>
                  <button className="hint" onClick={() => setTab('activity')} style={{ color: 'var(--violet)' }}>
                    View all
                  </button>
                </div>
                <div className="card-body">
                  {data.activity.slice(0, 6).map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </div>
              </section>
            </div>

            <section style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Most recently pushed</h2>
                <button className="hint" onClick={() => setTab('repos')} style={{ color: 'var(--violet)' }}>
                  All repositories
                </button>
              </div>
              <div className="repo-grid">
                {repos.slice(0, 8).map((repo) => (
                  <RepoCard key={repo.name} repo={repo} onOpen={() => setOpenRepo(repo.name)} />
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'deployments' && (
          <div className="fade-in" style={{ marginTop: 16 }}>
            <div className="chips" style={{ marginBottom: 10 }}>
              {(['all', 'success', 'failure', 'running'] as const).map((value) => (
                <button
                  key={value}
                  className="suggestion"
                  onClick={() => setRunFilter(value)}
                  style={
                    runFilter === value
                      ? { color: 'var(--fg)', borderColor: 'rgba(139,108,255,.5)', background: 'var(--violet-soft)' }
                      : undefined
                  }
                >
                  {value === 'all' ? 'All runs' : value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
            <section className="card">
              <div className="card-head">
                <h2>Deploy workflows</h2>
                <span className="hint">{runs.length} runs · sampled repositories</span>
              </div>
              <div className="card-body">
                {runs.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
                {runs.length === 0 && <div className="empty">Nothing matches this filter.</div>}
              </div>
            </section>
          </div>
        )}

        {tab === 'repos' && (
          <div className="fade-in" style={{ marginTop: 16 }}>
            <div className="card-head" style={{ padding: '0 0 10px', border: 0 }}>
              <h2>{repos.length} repositories</h2>
              <span className="hint">Sorted by last push</span>
            </div>
            <div className="repo-grid">
              {repos.map((repo) => (
                <RepoCard key={repo.name} repo={repo} onOpen={() => setOpenRepo(repo.name)} />
              ))}
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="fade-in" style={{ marginTop: 16 }}>
            <section className="card">
              <div className="card-head">
                <h2>Everything that happened lately</h2>
                <span className="hint">runs and pushes from the GitHub API</span>
              </div>
              <div className="card-body">
                {data.activity.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          </div>
        )}

        <footer style={{ marginTop: 26, fontSize: 10.5, color: 'var(--faint)', lineHeight: 1.6 }}>
          Generated {new Date(data.generatedAt).toLocaleString('en-GB')} from{' '}
          <a href={data.source.repos} target="_blank" rel="noreferrer" style={{ color: 'var(--muted)' }}>
            api.github.com
          </a>
          . Cached for two minutes; a failed source is reported, never filled in with a guess.
        </footer>
      </main>

      <AgentPanel project={agentProject} />

      {selected && (
        <RepoDrawer
          repo={selected}
          runs={runsByRepo.get(selected.name) ?? []}
          onClose={() => setOpenRepo(null)}
        />
      )}
    </div>
  )
}
