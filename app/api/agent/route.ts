import { gateway, generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const project = typeof body.project === 'string' ? body.project : 'studio-web'

    if (!prompt || prompt.length > 2000) {
      return NextResponse.json({ text: 'Please share a short project request so I can help.' }, { status: 400 })
    }

    const { text } = await generateText({
      model: gateway('anthropic/claude-sonnet-4.6'),
      system: `You are the personal build agent inside Firebase Studio. Help the user plan and build software clearly. Current project: ${project}. Give practical next steps, suggested files, Firebase architecture, and concise code guidance when useful. Do not claim to have changed files or deployed anything.`,
      prompt,
    })

    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({ text: 'The build agent could not respond. Check the AI Gateway connection and try again.' }, { status: 500 })
  }
}
