import { useEffect, useRef, useState } from 'react'

interface Issue {
  id: string
  title: string
  severity: string
  positionX?: number | null
  positionY?: number | null
  positionW?: number | null
  positionH?: number | null
  index: number
}

interface AnnotatedPreviewProps {
  imageUrl: string
  fileType?: string
  issues: Issue[]
  hoveredIssueId: string | null
  onIssueHover: (id: string | null) => void
  onIssueClick?: (id: string) => void
}

const SEV: Record<string, { border: string; fill: string; fillActive: string; badge: string; shadow: string }> = {
  critical: { border: '#FF2020', fill: 'rgba(255,32,32,0.22)',   fillActive: 'rgba(255,32,32,0.42)',   badge: '#C62828', shadow: '0 0 0 3px rgba(255,32,32,0.6), 0 0 20px 6px rgba(255,32,32,0.35)' },
  warning:  { border: '#FF8C00', fill: 'rgba(255,140,0,0.22)',   fillActive: 'rgba(255,140,0,0.42)',   badge: '#E65100', shadow: '0 0 0 3px rgba(255,140,0,0.6), 0 0 20px 6px rgba(255,140,0,0.35)' },
  info:     { border: '#1E88E5', fill: 'rgba(30,136,229,0.22)',  fillActive: 'rgba(30,136,229,0.42)',  badge: '#1565C0', shadow: '0 0 0 3px rgba(30,136,229,0.6), 0 0 20px 6px rgba(30,136,229,0.35)' },
}

// ── PDF renderer ──────────────────────────────────────────────────────────────

function usePdfCanvas(url: string, enabled: boolean) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [ready, setReady]   = useState(false)
  const [error, setError]   = useState(false)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function render() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        // Point the worker at the bundled worker file
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()

        const pdf    = await pdfjsLib.getDocument({ url, withCredentials: false }).promise
        const page   = await pdf.getPage(1)
        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        const viewport = page.getViewport({ scale: 2 }) // 2x for sharpness
        canvas.width   = viewport.width
        canvas.height  = viewport.height
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) setError(true)
      }
    }

    render()
    return () => { cancelled = true }
  }, [url, enabled])

  return { canvasRef, ready, error }
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnnotatedPreview({ imageUrl, fileType, issues, hoveredIssueId, onIssueHover, onIssueClick }: AnnotatedPreviewProps) {
  const isPdf = fileType === 'application/pdf'
  const { canvasRef, ready, error } = usePdfCanvas(imageUrl, isPdf)

  const positioned = issues.filter(
    (i) => i.positionX != null && i.positionY != null && i.positionW != null && i.positionH != null,
  )

  const markers = (
    <>
      {positioned.map((issue) => {
        const left   = issue.positionX! * 100
        const top    = issue.positionY! * 100
        const width  = issue.positionW! * 100
        const height = issue.positionH! * 100
        const active = hoveredIssueId === issue.id
        const c      = SEV[issue.severity] ?? SEV.info

        // Enforce minimum visible size
        const minW = Math.max(width, 4)
        const minH = Math.max(height, 1.5)

        return (
          <div
            key={issue.id}
            onMouseEnter={() => onIssueHover(issue.id)}
            onMouseLeave={() => onIssueHover(null)}
            onClick={() => onIssueClick?.(issue.id)}
            style={{
              position:        'absolute',
              left:            `${left}%`,
              top:             `${top}%`,
              width:           `${minW}%`,
              height:          `${minH}%`,
              minHeight:       8,
              border:          `3px solid ${c.border}`,
              backgroundColor: active ? c.fillActive : c.fill,
              borderRadius:    4,
              boxShadow:       active ? c.shadow : `0 0 0 2px ${c.border}88`,
              zIndex:          active ? 30 : 10,
              cursor:          'pointer',
              transition:      'background-color 0.12s, box-shadow 0.12s',
              boxSizing:       'border-box',
            }}
          >
            {/* Badge */}
            <div
              style={{
                position:        'absolute',
                top:             -14,
                left:            -6,
                minWidth:        24,
                height:          24,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                padding:         '0 5px',
                borderRadius:    999,
                backgroundColor: c.badge,
                border:          '2.5px solid white',
                color:           'white',
                fontFamily:      'monospace',
                fontSize:        11,
                fontWeight:      900,
                boxShadow:       '0 2px 8px rgba(0,0,0,0.55)',
                userSelect:      'none',
                transform:       active ? 'scale(1.25)' : 'scale(1)',
                transition:      'transform 0.12s',
                zIndex:          40,
                whiteSpace:      'nowrap',
              }}
            >
              {issue.index}
            </div>

            {/* Tooltip */}
            {active && (
              <div
                style={{
                  position:        'absolute',
                  bottom:          'calc(100% + 8px)',
                  left:            0,
                  backgroundColor: c.badge,
                  color:           'white',
                  padding:         '5px 10px',
                  borderRadius:    8,
                  fontSize:        11,
                  fontWeight:      600,
                  whiteSpace:      'nowrap',
                  maxWidth:        280,
                  overflow:        'hidden',
                  textOverflow:    'ellipsis',
                  boxShadow:       '0 4px 16px rgba(0,0,0,0.45)',
                  border:          '1.5px solid rgba(255,255,255,0.25)',
                  zIndex:          50,
                  pointerEvents:   'none',
                }}
              >
                #{issue.index} · {issue.title.slice(0, 40)}{issue.title.length > 40 ? '…' : ''}
              </div>
            )}
          </div>
        )
      })}
    </>
  )

  return (
    <div style={{ background: '#0A0A0F', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>

      {/* Preview area */}
      {isPdf ? (
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Canvas rendered by PDF.js */}
          <canvas
            ref={canvasRef}
            style={{
              display:   ready ? 'block' : 'none',
              width:     '100%',
              height:    'auto',
            }}
          />
          {/* Loading state */}
          {!ready && !error && (
            <div style={{ aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5E5954', fontSize: 13 }}>
              Cargando preview…
            </div>
          )}
          {error && (
            <div style={{ aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5E5954', fontSize: 13 }}>
              No se pudo renderizar el PDF
            </div>
          )}
          {/* Markers on top of canvas */}
          {ready && markers}
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%' }}>
          <img
            src={imageUrl}
            alt="Creative asset"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            draggable={false}
          />
          {markers}
        </div>
      )}

      {/* Legend */}
      {positioned.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#5E5954', letterSpacing: '0.1em' }}>MARKERS</span>
          {(['critical', 'warning', 'info'] as const).filter(s => positioned.some(i => i.severity === s)).map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, border: `2px solid ${SEV[s].border}`, backgroundColor: SEV[s].fill }} />
              <span style={{ fontSize: 10, color: '#5E5954', textTransform: 'capitalize' }}>{s}</span>
            </div>
          ))}
          <span style={{ fontSize: 10, color: '#5E5954', marginLeft: 'auto', fontFamily: 'monospace' }}>{positioned.length} marcados</span>
        </div>
      )}
    </div>
  )
}
