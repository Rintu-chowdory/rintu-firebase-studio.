import { NextResponse } from 'next/server'

/**
 * The studio agent.
 *
 * Resolution order:
 *  1. GROQ_API_KEY in this deployment: called directly, no third party in the middle.
 *  2. STUDIO_AGENT_PROXY: a server-side proxy that holds the credential, so the studio
 *     works on a deployment where no AI key is configured.
 *  3. An honest 503 that says the agent is not configured. It never pretends to work.
 *
 * The model is never told it can edit files or deploy; it only plans and explains.
 */
export const runtime = 'nodejs'

const PROXY_URL =
  process.env.STUDIO_AGENT_PROXY || 'https://superagent-d94c6091.base44.app/functions/groqStudioAgent'

const SYSTEM = (project: string) =>
  [
    'You are the build agent inside a personal developer studio dashboard.',
    'Answer concisely and practically: architecture, file changes, commands, trade-offs.',
    `The user is currently looking at "${project}".`,
    'You cannot read or modify their files, and you cannot deploy anything. Never claim you did.',
    'Prefer short paragraphs or tight bullet lists over long essays.',
  ].join(' ')

export async function POST(request: Request) {
  let body: { prompt?: unknown; project?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  const project = typeof body.project === 'string' ? body.project.slice(0, 120) : 'workspace'

  if (!prompt) return NextResponse.json({ error: 'Ask something first.' }, { status: 400 })
  if (prompt.length > 2000) {
    return NextResponse.json({ error: 'Keep the request under 2000 characters.' }, { status: 400 })
  }

  const key = process.env.GROQ_API_KEY
  if (key) {
    try {
      const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
          temperature: 0.4,
          max_tokens: 700,
          messages: [
            { role: 'system', content: SYSTEM(project) },
            { role: 'user', content: prompt },
          ],
        }),
      })
      if (upstream.ok) {
        const data = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[]
        }
        const text = data.choices?.[0]?.message?.content
        if (text) return NextResponse.json({ text, via: 'groq' })
      }
    } catch {
      // fall through to the proxy
    }
  }

  try {
    const proxied = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, project, system: SYSTEM(project) }),
    })
    const data = (await proxied.json()) as { text?: string; error?: string; detail?: string }
    if (proxied.ok && data.text) return NextResponse.json({ text: data.text, via: 'proxy' })
    return NextResponse.json(
      { error: 'The agent proxy refused the request.', detail: data.error ?? data.detail ?? proxied.status },
      { status: 502 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'The agent is not configured on this deployment.',
        detail:
          'Add GROQ_API_KEY to the project environment, or set STUDIO_AGENT_PROXY to a server that holds a key.',
        cause: error instanceof Error ? error.message : undefined,
      },
      { status: 503 },
    )
  }
}
