# Rintu Studio

A build and deploy console for Rintu's own repositories. It started as a v0
mock of Firebase Studio, where every number was invented. It now reads live data and says
so when a source fails.

## What is real

| Panel | Source | Freshness |
| --- | --- | --- |
| Repositories, languages, last push | `GET /users/{owner}/repos`, public GitHub API | cached 5 min |
| Workflow runs, deployments, durations | `GET /repos/{owner}/{repo}/actions/runs` for the 8 most recently pushed repos | cached 3 min |
| Stat cards (runs 30d, build minutes, success rate) | computed from those runs | on each rebuild |
| Build agent | `/api/agent` → Groq if `GROQ_API_KEY` is set, otherwise the server-side proxy `STUDIO_AGENT_PROXY` | per request |

There is no mock data left in the UI. When GitHub does not answer, the page shows the
failure instead of a plausible-looking number. Workflow runs are sampled from the most
recently pushed repositories so a refresh costs about nine GitHub requests instead of one
per repository; the sidebar documents that coverage.

## Environment

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | optional; lifts the API limit from 60 to 5000 req/h. A rejected token is dropped automatically and the request retried anonymously. |
| `STUDIO_OWNER` | GitHub account to summarise, defaults to `Rintu-chowdory` |
| `STUDIO_RUN_SAMPLE` | how many repositories get their Actions runs fetched, defaults to `8` |
| `GROQ_API_KEY` | makes the agent answer directly through Groq |
| `STUDIO_AGENT_PROXY` | server-side URL holding the LLM key, used when no local key exists |

No key is required for the dashboard itself: all of it is public GitHub data.

## Develop

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm build   # typecheck + production build (no ignoreBuildErrors)
```

## Layout

```
app/
  page.tsx              server component: fetches once, renders the client shell
  api/studio/route.ts   JSON snapshot, s-maxage=120
  api/agent/route.ts    Groq → proxy → honest 503
components/
  Studio.tsx            sidebar, tabs, stat cards, deployment table, repo drawer
  AgentPanel.tsx        chat UI with error states
lib/
  github.ts             GitHub aggregation, caching, token fallback
  format.ts             time, duration and status helpers
```

`next.config.mjs` no longer sets `ignoreBuildErrors`, so `pnpm build` fails on a type error
instead of shipping one.
