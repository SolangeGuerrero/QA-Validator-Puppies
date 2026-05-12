import { useState } from 'react'
import { ChevronRight, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Correction {
  id: string
  type: 'auto' | 'manual'
  title: string
  description: string
  overlayLabel: string   // text shown on the image box
  overlayColor: string   // border/badge color
  positionX: number      // 0-1 normalized
  positionY: number
  positionW: number
  positionH: number
  before?: string
  after?: string
  suggestedText?: string
  colorBefore?: string   // hex for PANTONE swatch
  colorAfter?: string
}

interface CorrectionViewProps {
  imageUrl: string
  corrections: Correction[]
}

// ─── Mock fallback data (matches the screenshot) ──────────────────────────────

export const MOCK_CORRECTIONS: Correction[] = [
  {
    id: 'c1', type: 'auto',
    title: 'Puppies logo clearance zone',
    description: 'The Puppies shield logo on the front panel does not meet the minimum 5mm clearance zone. Current clearance is 3.2mm on the right side.',
    overlayLabel: 'Clearance +1.8mm', overlayColor: '#FF5C39',
    positionX: 0.02, positionY: 0.03, positionW: 0.22, positionH: 0.14,
    before: 'margin-right: 3.2mm', after: 'margin-right: 5.0mm',
  },
  {
    id: 'c2', type: 'auto',
    title: 'Nutritional table font size',
    description: 'Scale ANÁLISIS GARANTIZADOS table from 5.5pt to 6pt minimum. Argentine regulatory standard requires 6pt for nutritional info.',
    overlayLabel: 'Font 5.5pt → 6pt', overlayColor: '#F57C00',
    positionX: 0.34, positionY: 0.21, positionW: 0.10, positionH: 0.08,
    before: 'font-size: 5.5pt', after: 'font-size: 6.0pt',
  },
  {
    id: 'c3', type: 'manual',
    title: 'Add SENASA registration number',
    description: 'Argentine regulation requires visible SENASA registration for pet food products. Suggested placement: bottom-left of back panel in 7pt font.',
    overlayLabel: '+ SENASA Reg.', overlayColor: '#FF5C39',
    positionX: 0.04, positionY: 0.62, positionW: 0.18, positionH: 0.07,
    suggestedText: 'SENASA Reg. N° XXXX · Establecimiento N° XXXX\nProducto inscripto ante SENASA',
  },
  {
    id: 'c4', type: 'auto',
    title: 'PANTONE P 872 saturation correction',
    description: 'Cat Chow logo on side panel uses P 872 at 85% saturation instead of 100%. Brand guidelines require exact PANTONE P 872 match.',
    overlayLabel: 'P 872 → 100%', overlayColor: '#F57C00',
    positionX: 0.60, positionY: 0.22, positionW: 0.14, positionH: 0.07,
    before: 'P 872 @ 85%', after: 'P 872 @ 100%',
    colorBefore: '#C4A35A', colorAfter: '#A07828',
  },
]

// ─── Image with correction overlays ──────────────────────────────────────────
// NOTE: Structure must match AnnotatedPreview exactly so the image renders.
// Use inline style for aspectRatio (Tailwind v4 slash parsing is unreliable).
// Label chips positioned INSIDE the overlay box to avoid overflow-hidden clipping.

function CorrectedImage({
  imageUrl,
  corrections,
  hoveredId,
  onHover,
}: {
  imageUrl: string
  corrections: Correction[]
  hoveredId: string | null
  onHover: (id: string | null) => void
}) {
  return (
    <div className="bg-[#0A0A0F] rounded-2xl overflow-hidden border border-white/[0.06]">
      <div className="relative" style={{ aspectRatio: '4/5' }}>
        <img
          src={imageUrl}
          alt="Creative with corrections"
          className="w-full h-full object-contain"
        />

        {corrections.map((c) => {
          const isHovered = hoveredId === c.id

          return (
            <div
              key={c.id}
              onMouseEnter={() => onHover(c.id)}
              onMouseLeave={() => onHover(null)}
              className="absolute cursor-pointer transition-all duration-150"
              style={{
                left:            `${c.positionX * 100}%`,
                top:             `${c.positionY * 100}%`,
                width:           `${c.positionW * 100}%`,
                height:          `${c.positionH * 100}%`,
                borderWidth:     isHovered ? 2 : 1.5,
                borderStyle:     'solid',
                borderColor:     c.overlayColor,
                backgroundColor: isHovered ? `${c.overlayColor}18` : 'transparent',
                borderRadius:    3,
                boxShadow:       isHovered ? `0 0 0 3px ${c.overlayColor}30` : 'none',
                zIndex:          isHovered ? 10 : 1,
              }}
            >
              {/* Label chip inside the box at top-left — avoids overflow clipping */}
              <div
                className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-white font-mono font-bold whitespace-nowrap overflow-hidden"
                style={{
                  backgroundColor: c.overlayColor,
                  fontSize: '7px',
                  maxWidth: 'calc(100% - 6px)',
                }}
              >
                {c.type === 'auto' ? <Wand2 size={7} className="shrink-0" /> : <span>+</span>}
                <span className="truncate">{c.overlayLabel}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Correction card (read-only) ──────────────────────────────────────────────

function CorrectionCard({
  correction,
  isHighlighted,
}: {
  correction: Correction
  isHighlighted: boolean
}) {
  const isAuto = correction.type === 'auto'

  return (
    <div className={cn(
      'bg-white rounded-xl border border-[#E5E7EB] transition-all duration-150 overflow-hidden',
      isHighlighted ? 'shadow-md ring-1 ring-[#E5E7EB]' : 'hover:shadow-sm',
    )}>
      {/* Type badge */}
      <div className="px-4 pt-3.5 pb-3">
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold',
          isAuto
            ? 'bg-[#FFF3E0] text-[#F57C00]'
            : 'bg-[#FFF8E1] text-[#F9A825]',
        )}>
          <span className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            isAuto ? 'bg-[#F57C00]' : 'bg-[#F9A825]',
          )} />
          {isAuto ? 'Auto-fixable' : 'Manual review'}
        </span>
      </div>

      {/* Title + description */}
      <div className="px-4 pb-3">
        <p className="font-semibold text-sm text-[#0A0A0F] mb-1">{correction.title}</p>
        <p className="text-xs text-[#5E5954] leading-relaxed">{correction.description}</p>
      </div>

      {/* Before → After (code type) */}
      {correction.before && correction.after && !correction.colorBefore && (
        <div className="px-4 pb-3.5 flex items-center gap-2 flex-wrap">
          <code className="px-2.5 py-1 rounded bg-[#FEECEC] text-[#D32F2F] text-[10px] font-mono">
            {correction.before}
          </code>
          <ChevronRight size={12} className="text-[#5E5954] shrink-0" />
          <code className="px-2.5 py-1 rounded bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-mono">
            {correction.after}
          </code>
        </div>
      )}

      {/* Color swatches (PANTONE type) */}
      {correction.colorBefore && correction.colorAfter && (
        <div className="px-4 pb-3.5 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded border border-[#E5E7EB]" style={{ backgroundColor: correction.colorBefore }} />
            <div className="text-[10px] text-[#5E5954] font-mono">
              <div>Current</div>
              <div className="font-semibold text-[#3D3A35]">{correction.before}</div>
            </div>
          </div>
          <ChevronRight size={14} className="text-[#E5E7EB]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded border border-[#E5E7EB]" style={{ backgroundColor: correction.colorAfter }} />
            <div className="text-[10px] text-[#5E5954] font-mono">
              <div>Corrected</div>
              <div className="font-semibold text-[#3D3A35]">{correction.after}</div>
            </div>
          </div>
        </div>
      )}

      {/* Suggested text (manual type) */}
      {correction.suggestedText && (
        <div className="mx-4 mb-3.5 rounded-lg bg-[#0A0A0F] px-3 py-2.5 overflow-hidden">
          <p className="font-mono text-[9px] text-[#8B5CF6] tracking-widest mb-1.5">SUGGESTED TEXT:</p>
          <pre className="font-mono text-[10px] text-[#c5c1b9] whitespace-pre-wrap leading-relaxed">
            {correction.suggestedText}
          </pre>
        </div>
      )}
    </div>
  )
}

// ─── Main CorrectionView ──────────────────────────────────────────────────────

export function CorrectionView({ imageUrl, corrections }: CorrectionViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const autoCount   = corrections.filter(c => c.type === 'auto').length
  const manualCount = corrections.filter(c => c.type === 'manual').length

  return (
    <div className="space-y-4">
      {/* Sub-header: fixes counter */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">+ AI CORRECTIONS</span>
        {autoCount > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-[#FF5C39] text-white text-[9px] font-mono font-bold">
            {autoCount} auto-fixable
          </span>
        )}
        {manualCount > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-[#FAFAFA] text-[#5E5954] text-[9px] font-mono">
            {manualCount} manual review
          </span>
        )}
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-[1fr_400px] gap-5 items-start">
        {/* Left: annotated image */}
        <div className="sticky top-6">
          <CorrectedImage
            imageUrl={imageUrl}
            corrections={corrections}
            hoveredId={hoveredId}
            onHover={setHoveredId}
          />
        </div>

        {/* Right: correction cards */}
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
          {corrections.map((c) => (
            <div
              key={c.id}
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <CorrectionCard
                correction={c}
                isHighlighted={hoveredId === c.id}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
