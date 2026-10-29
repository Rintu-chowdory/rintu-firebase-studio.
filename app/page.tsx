import { getStudioData } from '@/lib/github'
import type { StudioData } from '@/lib/types'
import Studio from '@/components/Studio'

export const revalidate = 120

export default async function Page() {
  let data: StudioData | null = null
  let failure: string | null = null

  try {
    data = await getStudioData()
  } catch (error) {
    failure = error instanceof Error ? error.message : 'Unknown error'
  }

  if (!data) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: 'var(--bg)',
          color: 'var(--fg)',
        }}
      >
        <div
          style={{
            maxWidth: 520,
            border: '1px solid var(--line)',
            borderRadius: 14,
            background: 'var(--surface)',
            padding: 22,
          }}
        >
          <h1 style={{ fontSize: 18, margin: 0 }}>The studio could not load your data</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
            GitHub did not answer. This page shows nothing rather than invented numbers.
          </p>
          <pre
            style={{
              fontSize: 11,
              color: 'var(--faint)',
              whiteSpace: 'pre-wrap',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 12,
              margin: 0,
            }}
          >
            {failure}
          </pre>
        </div>
      </main>
    )
  }

  return <Studio initial={data} />
}
