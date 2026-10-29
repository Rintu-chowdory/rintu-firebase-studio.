import { NextResponse } from 'next/server'
import { getStudioData } from '@/lib/github'

// The aggregation itself is cached per GitHub request (see lib/github.ts), so this route
// stays cheap. `revalidate` also lets the CDN answer repeat visits without waking Node.
export const revalidate = 120

export async function GET() {
  try {
    const data = await getStudioData()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'GitHub data unavailable',
        detail: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 502 },
    )
  }
}
