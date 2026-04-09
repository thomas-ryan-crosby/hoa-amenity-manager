'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', margin: 0 }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <p style={{ color: '#059669', fontSize: '13px', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase' as const }}>Neighbri</p>
            <h1 style={{ marginTop: '16px', fontSize: '28px', fontWeight: 700, color: '#1c1917' }}>Something went wrong</h1>
            <p style={{ marginTop: '16px', fontSize: '14px', color: '#57534e', lineHeight: 1.6 }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{ marginTop: '24px', background: '#059669', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
