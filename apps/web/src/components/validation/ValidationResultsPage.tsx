import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  FileDown, AlertTriangle, AlertCircle, Info, CheckCircle2,
  Sparkles, RefreshCw, ChevronRight, X, FileText, Copy, RotateCcw, Maximize2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useValidatingStore } from '@/stores/ui'
import { cn } from '@/lib/utils'
import type { ValidationIssue, ValidationData } from '@/lib/types'
import type { Correction } from './CorrectionView'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInformeText(
  corrections: Correction[],
  asset: ValidationData['asset'],
  score: number,
  documentsUsed: ValidationData['documentsUsed'] = [],
): string {
  const reportDocs = (documentsUsed ?? []).map(d => d.name)
  const today     = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const autoCount = corrections.filter(c => c.type === 'auto').length
  const manCount  = corrections.filter(c => c.type === 'manual').length
  const lines: string[] = [
    'INFORME DE CORRECCIONES — Puppies QA',
    '═'.repeat(52),
    '',
    '▸ PIEZA ANALIZADA',
    `  Producto  : ${asset.product.name}`,
    `  SKU       : ${asset.product.sku}`,
    `  Marca     : ${asset.product.brand}`,
    `  Archivo   : ${asset.fileName}`,
    `  Score     : ${score}% compliance`,
    `  Fecha     : ${today}`,
    '',
    '▸ DOCUMENTACIÓN DE REFERENCIA UTILIZADA',
    ...(reportDocs.length > 0 ? reportDocs.map(d => `  ✓ ${d}`) : ['  (sin documentos adjuntos)']),
    '',
    '▸ RESUMEN EJECUTIVO',
    `  Se identificaron ${corrections.length} correcciones en el arte creativo.`,
    `  · ${autoCount} auto-corregibles   ·  ${manCount} de revisión manual`,
    '',
    '═'.repeat(52),
    '▸ DETALLE DE CORRECCIONES',
    '',
  ]
  corrections.forEach((c, i) => {
    const typeLabel = c.type === 'auto' ? 'AUTO-CORREGIBLE' : 'REVISIÓN MANUAL'
    lines.push(`${i + 1}. ${c.title.toUpperCase()}  [${typeLabel}]`)
    lines.push(`   ${c.description}`)
    if (c.before && c.after) lines.push(`   Cambio requerido : ${c.before}  →  ${c.after}`)
    if (c.suggestedText) lines.push(`   Texto sugerido:\n   ${c.suggestedText.replace(/\n/g, '\n   ')}`)
    lines.push('')
  })
  lines.push('═'.repeat(52))
  lines.push('Por favor, realice las correcciones indicadas y reenvíe')
  lines.push('el arte actualizado para su revisión y aprobación final.')
  lines.push('')
  lines.push('Puppies QA — Sistema de Validación Creativa')
  return lines.join('\n')
}

// ─── Informe Modal ────────────────────────────────────────────────────────────

function InformeModal({
  text,
  validationId,
  onRegenerate,
  onSendForApproval,
  onClose,
}: {
  text: string
  validationId: string
  onRegenerate: () => string
  onSendForApproval: (note: string, pdfUrl: string | null) => void
  onClose: () => void
}) {
  const [body, setBody]             = useState(text)
  const [copied, setCopied]         = useState(false)
  const [pdfUrl, setPdfUrl]         = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [pdfError, setPdfError]     = useState(false)
  const [pdfFullscreen, setPdfFullscreen] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    api.download(`/validations/${validationId}/report`, 'POST')
      .then(blob => {
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      })
      .catch(() => setPdfError(true))
      .finally(() => setPdfLoading(false))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [validationId])

  const handleDownload = () => {
    if (!pdfUrl) return
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = `compliance-report-${validationId}.pdf`
    a.click()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(body).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
    {/* PDF fullscreen overlay */}
    {pdfFullscreen && pdfUrl && (
      <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <p className="text-white text-xs font-mono tracking-widest opacity-60">REPORTE PDF</p>
          <button
            onClick={() => setPdfFullscreen(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-all"
          >
            <X size={13} /> Cerrar
          </button>
        </div>
        <iframe src={pdfUrl} className="flex-1 w-full border-0" title="Compliance Report PDF — Fullscreen" />
      </div>
    )}
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#FAFAFA] shrink-0">
          <div>
            <p className="font-bold text-base text-[#0F0F0D]">Informe de Correcciones</p>
            <p className="text-xs text-[#5E5954] mt-0.5">Puppies QA · Revisá el reporte y el informe, editá si hace falta, y enviá para aprobación</p>
          </div>
          <button onClick={onClose} className="text-[#5E5954] hover:text-[#0A0A0F] transition-colors ml-4">
            <X size={16} />
          </button>
        </div>

        {/* Two-panel body */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* Left: PDF preview */}
          <div className="w-1/2 flex flex-col border-r border-[#FAFAFA]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#FAFAFA] shrink-0">
              <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">REPORTE PDF</p>
              {pdfUrl && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPdfFullscreen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5E7EB] text-xs text-[#3D3A35] hover:bg-[#FAFAFA] transition-all"
                    title="Ampliar PDF"
                  >
                    <Maximize2 size={11} /> Ampliar
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5E7EB] text-xs text-[#3D3A35] hover:bg-[#FAFAFA] transition-all"
                  >
                    <FileDown size={11} /> Descargar
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              {pdfLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-[#5E5954]">
                  <RefreshCw size={20} className="animate-spin text-[#8B5CF6]" />
                  <p className="text-xs">Generando reporte PDF…</p>
                </div>
              ) : pdfError ? (
                <div className="flex items-center justify-center h-full text-sm text-[#5E5954]">
                  No se pudo generar el reporte
                </div>
              ) : (
                <iframe src={pdfUrl!} className="w-full h-full border-0" title="Compliance Report PDF" />
              )}
            </div>
          </div>

          {/* Right: Informe text */}
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-2.5 border-b border-[#FAFAFA] shrink-0">
              <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">INFORME DE CORRECCIONES</p>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full h-full font-mono text-[11px] text-[#0F0F0D] leading-relaxed bg-[#FAFAFA] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 border border-[#E5E7EB]"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#F3F4F6] shrink-0 bg-[#FFFFFF]">
          <div className="flex gap-2">
            <button
              onClick={() => setBody(onRegenerate())}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-[#3D3A35] hover:border-[#5E5954] hover:text-[#0A0A0F] text-sm font-medium transition-all"
            >
              <RotateCcw size={13} /> Regenerar texto
            </button>
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all',
                copied ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]' : 'border-[#E5E7EB] text-[#3D3A35] hover:bg-[#FAFAFA]',
              )}
            >
              <Copy size={13} /> {copied ? 'Copiado!' : 'Copiar texto'}
            </button>
          </div>
          <button
            onClick={() => onSendForApproval(body, pdfUrl)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#FF5C39] hover:bg-[#E54E2A] text-white transition-all shadow-sm shadow-[#FF5C39]/20"
          >
            <Sparkles size={13} /> Se ve bien → Enviar para aprobación
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

// ─── Send for Approval Modal ──────────────────────────────────────────────────

function ApprovalModal({ onClose, initialNote = '', attachedPdfUrl = null, validationId }: { onClose: () => void; initialNote?: string; attachedPdfUrl?: string | null; validationId: string }) {
  const [email, setEmail]     = useState('')
  const [ccInput, setCcInput] = useState('')
  const [ccList, setCcList]   = useState<string[]>([])
  const [note, setNote]       = useState(initialNote)
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const handleAddCc = () => {
    const val = ccInput.trim()
    if (val && !ccList.includes(val)) setCcList(p => [...p, val])
    setCcInput('')
  }

  const handleCcKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddCc() }
  }

  const handleSend = async () => {
    if (!email) return
    setSending(true)
    setSendError(null)
    try {
      await api.post(`/validations/${validationId}/send-approval`, { to: email, cc: ccList, note })
      setSent(true)
      setTimeout(onClose, 2000)
    } catch (err) {
      setSendError((err as Error).message ?? 'Error al enviar el email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#FAFAFA]">
          <div>
            <p className="font-semibold text-[#0A0A0F]">Send for Approval</p>
            <p className="text-xs text-[#5E5954] mt-0.5">Send this validation report for review</p>
          </div>
          <button onClick={onClose} className="text-[#5E5954] hover:text-[#0A0A0F] transition-colors">
            <X size={16} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CheckCircle2 size={32} className="text-[#2E7D32] mb-3" />
            <p className="font-semibold text-[#0A0A0F]">Email enviado correctamente</p>
            <p className="text-xs text-[#5E5954] mt-1">{email}</p>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#3D3A35]">Para</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="approver@purina.com"
                className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#FF5C39] focus:ring-2 focus:ring-[#FF5C39]/10 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#3D3A35]">CC <span className="text-[#8C8782]">(Enter o coma para agregar)</span></label>
              {ccList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {ccList.map(cc => (
                    <span key={cc} className="flex items-center gap-1 px-2 py-0.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg text-xs text-[#3D3A35]">
                      {cc}
                      <button onClick={() => setCcList(p => p.filter(x => x !== cc))} className="text-[#8C8782] hover:text-[#D32F2F] ml-0.5">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="email"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyDown={handleCcKey}
                onBlur={handleAddCc}
                placeholder="cc@purina.com"
                className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#FF5C39] focus:ring-2 focus:ring-[#FF5C39]/10 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#3D3A35]">Nota <span className="text-[#8C8782]">(opcional)</span></label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Agregá un mensaje para el revisor…"
                rows={note.length > 100 ? 10 : 3}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs font-mono outline-none focus:border-[#FF5C39] focus:ring-2 focus:ring-[#FF5C39]/10 transition-all resize-y"
              />
            </div>

            {/* Attachment indicator */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#3D3A35]">Adjunto</label>
              {attachedPdfUrl ? (
                <a
                  href={attachedPdfUrl}
                  download="compliance-report.pdf"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#E5E7EB] bg-[#FFF8F8] hover:bg-[#FFF0F0] transition-colors group"
                >
                  <div className="w-7 h-8 flex items-center justify-center rounded bg-[#FF5C39]/10 shrink-0">
                    <FileText size={14} className="text-[#FF5C39]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#0A0A0F] truncate">compliance-report.pdf</p>
                    <p className="text-[10px] text-[#8C8782]">Reporte de compliance adjunto</p>
                  </div>
                  <FileDown size={12} className="text-[#8C8782] group-hover:text-[#FF5C39] shrink-0 transition-colors" />
                </a>
              ) : (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA]">
                  <RefreshCw size={12} className="text-[#8C8782] animate-spin" />
                  <p className="text-xs text-[#8C8782]">Generando reporte PDF…</p>
                </div>
              )}
            </div>

            {sendError && (
              <p className="text-xs text-[#D32F2F] bg-[#FFEBEE] px-3 py-2 rounded-lg">{sendError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                disabled={sending}
                className="flex-1 h-10 rounded-xl border border-[#E5E7EB] text-sm text-[#3D3A35] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={!email || sending}
                className={cn(
                  'flex-1 h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                  email && !sending ? 'bg-[#0A0A0F] hover:bg-[#2A2A28] text-white' : 'bg-[#FAFAFA] text-[#8C8782] cursor-not-allowed',
                )}
              >
                {sending ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {sending ? 'Enviando…' : 'Enviar para aprobación'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Plain asset preview (no annotations) ────────────────────────────────────

function AssetPreview({ fileUrl, fileType }: { fileUrl: string; fileType?: string }) {
  const isPdf = fileType === 'application/pdf'
  return (
    <div style={{ background: '#0A0A0F', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      {isPdf ? (
        <iframe
          src={fileUrl}
          title="Asset preview"
          style={{ width: '100%', height: 600, border: 'none', display: 'block' }}
        />
      ) : (
        <img
          src={fileUrl}
          alt="Asset preview"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          draggable={false}
        />
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ValidationResultsPage() {
  const { validationId } = useParams({ from: '/validations/$validationId' })
  const navigate = useNavigate()
  const setValidating = useValidatingStore((s) => s.setValidating)

  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalNote, setApprovalNote]           = useState('')
  const [approvalPdfUrl, setApprovalPdfUrl]       = useState<string | null>(null)
  const [showInformeModal, setShowInformeModal]   = useState(false)
  const [informeText, setInformeText]             = useState('')
  const issueRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const { data, isLoading } = useQuery<ValidationData>({
    queryKey: ['validation', validationId],
    queryFn: () => api.get(`/validations/${validationId}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return (status === 'pending' || status === 'running') ? 2000 : false
    },
  })

  useEffect(() => {
    if (!data) return
    const done = data.status !== 'pending' && data.status !== 'running'
    if (done) setValidating(null)
  }, [data?.status, setValidating])

  // Browser notification when validation finishes
  const prevStatusRef = useRef<string | null>(null)
  useEffect(() => {
    if (!data) return
    const prev = prevStatusRef.current
    const curr = data.status
    prevStatusRef.current = curr

    const justFinished = (prev === 'pending' || prev === 'running') && curr !== 'pending' && curr !== 'running'
    if (!justFinished) return

    const sendNotif = () => {
      const score   = data.complianceScore
      const label   = curr === 'completed'
        ? `Score: ${score ?? '—'}% · ${data.totalIssues} críticos`
        : 'La validación falló — revisá los logs'
      new Notification('Puppies QA — Validación completa', {
        body: `${data.asset.fileName}\n${label}`,
        icon: '/puppies-logo.svg',
      })
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        sendNotif()
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => { if (p === 'granted') sendNotif() })
      }
    }
  }, [data?.status])

  if (isLoading) return <ValidationSkeleton />
  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-[#5E5954] text-sm">Validation not found</p>
    </div>
  )

  const isPending  = data.status === 'pending' || data.status === 'running'
  const isFailed   = data.status === 'failed'
  const allIssues  = data.issues
  const criticalN  = allIssues.filter(i => i.severity === 'critical').length
  const warningN   = allIssues.filter(i => i.severity === 'warning').length
  const score      = data.complianceScore ?? 0
  const scoreColor = score >= 80 ? '#2E7D32' : score >= 60 ? '#F57C00' : '#D32F2F'
  const corrections: Correction[] = allIssues.map((issue) => ({
    id:            issue.id,
    type:          issue.severity === 'info' ? 'manual' : 'auto',
    title:         issue.title,
    description:   issue.description,
    overlayLabel:  issue.suggestion?.slice(0, 18) ?? issue.title.slice(0, 18),
    overlayColor:  issue.severity === 'critical' ? '#FF5C39' : '#F57C00',
    positionX:     0,
    positionY:     0,
    positionW:     0,
    positionH:     0,
    suggestedText: issue.severity === 'info' ? issue.suggestion : undefined,
  }))

  const handleGenerateInforme = () => {
    const text = buildInformeText(corrections, data.asset, score, data.documentsUsed)
    setInformeText(text)
    setShowInformeModal(true)
  }

  return (
    <>
      {showApprovalModal && (
        <ApprovalModal
          validationId={validationId}
          initialNote={approvalNote}
          attachedPdfUrl={approvalPdfUrl}
          onClose={() => { setShowApprovalModal(false); setApprovalNote(''); setApprovalPdfUrl(null) }}
        />
      )}
      {showInformeModal && (
        <InformeModal
          text={informeText}
          validationId={validationId}
          onRegenerate={() => buildInformeText(corrections, data.asset, score, data.documentsUsed)}
          onSendForApproval={(note, pdfUrl) => {
            setApprovalNote(note)
            setApprovalPdfUrl(pdfUrl)
            setShowInformeModal(false)
            setShowApprovalModal(true)
          }}
          onClose={() => setShowInformeModal(false)}
        />
      )}

      <div className="space-y-4 animate-fade-in-up">

        {/* ── Top header: breadcrumb + action buttons ── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate({ to: '/upload' })}
              className="text-[#5E5954] hover:text-[#3D3A35] transition-colors"
            >
              Validation Results
            </button>
            <ChevronRight size={14} className="text-[#E5E7EB]" />
            <span className="text-[#0A0A0F] font-semibold">AI Correction Assistant</span>
          </div>

          {data.status === 'completed' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleGenerateInforme}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#3D3A35] hover:border-[#8B5CF6] hover:text-[#8B5CF6] text-sm font-medium transition-all"
              >
                <FileText size={13} /> Generate Informe
              </button>
              <button
                onClick={() => setShowApprovalModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0F] hover:bg-[#2A2A28] text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
              >
                <Sparkles size={13} /> Send for Approval
              </button>
            </div>
          )}
        </div>

        {/* ── Product info + file meta ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[#0A0A0F] text-xl font-bold">{data.asset.product.name}</h1>
            <p className="text-[#5E5954] text-xs mt-0.5 font-mono">
              SKU: {data.asset.product.sku} · {data.asset.fileName}
            </p>
          </div>
          {data.status === 'completed' && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">+ AI CORRECTIONS</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF5C39] text-white text-[9px] font-mono font-bold">
                {corrections.filter(c => c.type === 'auto').length} fixes ready
              </span>
            </div>
          )}
        </div>

        {/* ── Processing state ── */}
        {isPending && (
          <div className="bg-[#0A0A0F] rounded-2xl p-6 flex items-center gap-4 border border-white/[0.04]">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full border-2 border-[#FF5C39]/20 border-t-[#FF5C39] animate-spin" />
              <Sparkles size={14} className="absolute inset-0 m-auto text-[#FF5C39]" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">
                {data.status === 'pending' ? 'QUEUED' : 'AI ANALYZING'}
              </p>
              <p className="text-[#c5c1b9] text-sm mt-0.5">
                {data.status === 'pending'
                  ? 'Waiting in queue…'
                  : 'Analyzing your packaging art with AI…'}
              </p>
            </div>
          </div>
        )}

        {/* ── Failed state ── */}
        {isFailed && (
          <div className="bg-[#FFF5F5] rounded-2xl p-6 flex items-start gap-4 border border-[#FECACA]">
            <AlertCircle size={20} className="text-[#D32F2F] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-[#0A0A0F] text-sm">Validation failed</p>
              <p className="text-[#5E5954] text-xs mt-1 leading-relaxed">
                The AI engine encountered an error while analyzing this asset. Check the API logs for details, then try again.
              </p>
              <button
                onClick={() => navigate({ to: '/upload' })}
                className="mt-3 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#FECACA] hover:border-[#D32F2F] text-[#D32F2F] text-xs font-medium transition-all"
              >
                <RefreshCw size={12} /> Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Stats row ── */}
        {data.status === 'completed' && (
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-[#0A0A0F] rounded-xl p-4 text-center">
              <p className="font-mono text-[9px] text-[#8C8782] tracking-widest mb-1.5">COMPLIANCE</p>
              <p className="text-2xl font-bold" style={{ color: scoreColor }}>{score}%</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
              <p className="font-mono text-[9px] text-[#5E5954] tracking-widest mb-1.5">ISSUES FOUND</p>
              <p className="text-2xl font-bold text-[#0A0A0F]">{allIssues.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
              <p className="font-mono text-[9px] text-[#5E5954] tracking-widest mb-1.5">WARNINGS</p>
              <p className="text-2xl font-bold text-[#F57C00]">{warningN}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
              <p className="font-mono text-[9px] text-[#5E5954] tracking-widest mb-1.5">PASSED</p>
              <p className="text-2xl font-bold text-[#2E7D32]">{data.totalPassed}</p>
            </div>
          </div>
        )}

        {/* ── Summary ── */}
        {data.summary && (
          <div className="bg-[#FAFAFA] rounded-xl px-4 py-3 border border-[#E5E7EB]">
            <p className="text-[#3D3A35] text-sm leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* ── Analysis view ── */}
        {data.status === 'completed' && (
          <>
            {/* Section label */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">+ ORIGINAL CON AI CORRECTIONS</span>
              {allIssues.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#F57C00] text-white text-[9px] font-mono font-bold">
                  {allIssues.length} issues
                </span>
              )}
              {criticalN > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FEECEC] text-[#D32F2F] text-[9px] font-mono font-bold">
                  {criticalN} critical
                </span>
              )}
            </div>

            {/* Preview + issues */}
            <div className="grid grid-cols-[1fr_400px] gap-5 items-start">
              <div className="sticky top-6">
                <AssetPreview fileUrl={data.asset.fileUrl} fileType={data.asset.fileType} />
              </div>

              <div className="flex flex-col gap-4">
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-0.5">
                  {allIssues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-[#E5E7EB]">
                      <CheckCircle2 size={24} className="text-[#2E7D32] mb-2" />
                      <p className="text-[#0A0A0F] font-medium text-sm">All checks passed!</p>
                    </div>
                  ) : (
                    allIssues.map((issue, idx) => (
                      <div key={issue.id} ref={(el) => { issueRefs.current[issue.id] = el }}>
                        <IssueCard issue={{ ...issue, index: idx + 1 }} isHighlighted={false} isPinned={false} />
                      </div>
                    ))
                  )}
                </div>

                {/* Docs used */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#FAFAFA]">
                    <p className="font-mono text-[9px] text-[#5E5954] tracking-widest">DOCUMENTATION USED</p>
                  </div>
                  {(() => {
                    const docs = data.documentsUsed ?? []
                    if (docs.length === 0) {
                      return <div className="px-4 py-2.5 text-xs text-[#5E5954]">Sin documentos adjuntos</div>
                    }
                    return docs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#FAFAFA] last:border-0">
                        <FileText size={13} className="text-[#FF5C39] shrink-0" />
                        <span className="text-xs text-[#3D3A35]">{doc.name}</span>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </>
  )
}

// ─── Issue Card ───────────────────────────────────────────────────────────────

function IssueCard({ issue, isHighlighted, isPinned = false }: {
  issue: ValidationIssue & { index: number }
  isHighlighted: boolean
  isPinned?: boolean
}) {
  const SevIcon = issue.severity === 'critical' ? AlertCircle
    : issue.severity === 'warning' ? AlertTriangle : Info

  const sev = {
    critical: { numBg: 'bg-[#D32F2F]', badge: 'bg-[#FEECEC] text-[#D32F2F]', ring: 'ring-[#D32F2F]/30', icon: '#D32F2F' },
    warning:  { numBg: 'bg-[#F57C00]', badge: 'bg-[#FFF3E0] text-[#F57C00]',  ring: 'ring-[#F57C00]/30', icon: '#F57C00' },
    info:     { numBg: 'bg-[#1565C0]', badge: 'bg-[#E3F2FD] text-[#1565C0]',  ring: 'ring-[#1565C0]/30', icon: '#1565C0' },
  }[issue.severity] ?? { numBg: 'bg-[#5E5954]', badge: 'bg-[#FAFAFA] text-[#3D3A35]', ring: 'ring-[#5E5954]/30', icon: '#5E5954' }

  return (
    <div className={cn(
      'bg-white rounded-xl border p-3.5 transition-all duration-150',
      isPinned
        ? `border-[#E5E7EB] shadow-lg ring-2 ${sev.ring}`
        : isHighlighted
          ? 'border-[#E5E7EB] shadow-md'
          : 'border-[#E5E7EB] hover:shadow-sm',
    )}>
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-white font-mono text-[9px] font-bold shrink-0', sev.numBg)}>
          {issue.index}
        </div>
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold capitalize', sev.badge)}>
          <SevIcon size={8} />
          {issue.severity}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#FAFAFA] text-[#5E5954] capitalize border border-[#F3F4F6]">
          {issue.category}
        </span>
      </div>
      <p className="text-sm font-semibold text-[#0A0A0F] mb-1 leading-snug">{issue.title}</p>
      <p className="text-xs text-[#5E5954] leading-relaxed mb-2">{issue.description}</p>
      {issue.suggestion && (
        <div className="flex items-start gap-2 bg-[#FAFAFA] rounded-lg px-3 py-2">
          <span className="text-[#8B5CF6] text-xs shrink-0 mt-px">💡</span>
          <p className="text-xs text-[#3D3A35] leading-relaxed">{issue.suggestion}</p>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ValidationSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-6 bg-[#F3F4F6] rounded-lg w-72" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-[#F3F4F6] rounded-xl" />)}
      </div>
      <div className="grid grid-cols-[1fr_400px] gap-5">
        <div className="aspect-[4/5] bg-[#F3F4F6] rounded-2xl" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-[#F3F4F6] rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}

