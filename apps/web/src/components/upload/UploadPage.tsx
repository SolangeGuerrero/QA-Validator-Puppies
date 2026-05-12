import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  CloudUpload, X, FileText, Sparkles, AlertCircle,
  ImageIcon, Plus, Trash2, CheckCircle2, Package, FileUp,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useValidatingStore } from '@/stores/ui'
import { cn, formatBytes } from '@/lib/utils'
import type { Product } from '../products/ProductsPage'

interface ProductsResponse { products: Product[]; total: number }
interface UploadedFile { file: File; preview: string; isPdf: boolean; id: string }
interface RefDoc { file: File; name: string; size: string; id: string }

export function UploadPage() {
  const navigate = useNavigate()
  const setValidating = useValidatingStore((s) => s.setValidating)
  const { t } = useTranslation('app')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [showProductList, setShowProductList] = useState(false)
  const [refDocs, setRefDocs] = useState<RefDoc[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const { data: productsData } = useQuery<ProductsResponse>({
    queryKey: ['products-selector', productSearch],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' })
      if (productSearch) params.set('search', productSearch)
      return api.get(`/products?${params}`)
    },
    enabled: showProductList,
  })

  // ── Artwork dropzone ──────────────────────────────────────────────────────
  // Revoke all object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => { files.forEach(f => URL.revokeObjectURL(f.preview)) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDropArtwork = useCallback((accepted: File[]) => {
    const newFiles: UploadedFile[] = accepted.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      isPdf: f.type === 'application/pdf',
      id: crypto.randomUUID(),
    }))
    setFiles(prev => {
      const updated = [...prev, ...newFiles]
      setActiveIdx(updated.length - 1)
      return updated
    })
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropArtwork,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024,
  })

  const removeFile = (id: string) => {
    setFiles(prev => {
      const removed = prev.find(f => f.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      const next = prev.filter(f => f.id !== id)
      if (activeIdx >= next.length) setActiveIdx(Math.max(0, next.length - 1))
      return next
    })
  }

  // ── Docs dropzone (multi-file) ────────────────────────────────────────────
  const onDropDocs = useCallback((accepted: File[]) => {
    setRefDocs(prev => [
      ...prev,
      ...accepted.map(f => ({
        file: f,
        name: f.name,
        size: formatBytes(f.size),
        id: crypto.randomUUID(),
      })),
    ])
  }, [])

  const { getRootProps: getDocRootProps, getInputProps: getDocInputProps, isDragActive: isDocDrag } = useDropzone({
    onDrop: onDropDocs,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 25 * 1024 * 1024,
  })

  // ── Mutation ──────────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!files.length || !selectedProduct) throw new Error('Required')

      // Upload reference documents to the product (if any) and capture their IDs
      const newDocIds: string[] = []
      for (const doc of refDocs) {
        const docForm = new FormData()
        docForm.append('file', doc.file)
        const uploaded = await api.upload<{ id: string }>(`/products/${selectedProduct.id}/documents`, docForm)
        if (uploaded?.id) newDocIds.push(uploaded.id)
      }

      // Upload creative asset
      const formData = new FormData()
      formData.append('file', files[activeIdx].file)
      formData.append('productId', selectedProduct.id)
      const { assetId } = await api.upload<{ assetId: string }>('/creative-assets/upload', formData)
      const { validationId } = await api.post<{ validationId: string }>('/validations', {
        creativeAssetId: assetId,
        documentIds: newDocIds,
      })
      return validationId
    },
    onSuccess: (validationId) => {
      setValidating(validationId)
      navigate({ to: '/validations/$validationId', params: { validationId } })
    },
    onError: (err: Error) => {
      setError(err.message || t('upload.failedToStart'))
      setIsProcessing(false)
    },
  })

  const handleRun = () => {
    if (!selectedProduct) { setError(t('upload.selectFirst')); return }
    setError(null)
    setIsProcessing(true)
    uploadMutation.mutate()
  }

  const activeFile = files[activeIdx] ?? null
  const displayProducts = productsData?.products ?? []
  const canRun = files.length > 0 && selectedProduct != null && !isProcessing

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-[#0A0A0F] text-2xl font-bold">{t('upload.title')}</h1>
        <p className="text-[#5E5954] text-sm mt-1">{t('upload.subtitle')}</p>
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-6 items-start">

        {/* ── Left: form ── */}
        <div className="space-y-5">

          {/* 1. Artwork drop zone */}
          <div
            {...getRootProps()}
            className={cn(
              'relative w-full rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
              isDragActive
                ? 'border-[#FF5C39] bg-[#FF5C39]/[0.03] scale-[1.01]'
                : 'border-[#E5E7EB] bg-white hover:border-[#A78BFA] hover:bg-[#FFFFFF]',
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center py-14 px-8">
              <CloudUpload
                size={36}
                className={cn('mb-4 transition-colors', isDragActive ? 'text-[#FF5C39]' : 'text-[#5E5954]')}
              />
              <p className="text-[#0A0A0F] font-semibold text-base mb-1.5">
                {isDragActive ? t('upload.dropzone.active') : t('upload.dropzone.idle')}
              </p>
              <p className="text-[#5E5954] text-xs mb-5">{t('upload.dropzone.hint')}</p>
              <div className="px-5 py-2 bg-[#FF5C39] hover:bg-[#E54E2A] rounded-lg text-white text-sm font-medium transition-colors">
                {t('upload.dropzone.browse')}
              </div>
            </div>
          </div>

          {/* File chips */}
          {files.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {files.map((f, i) => (
                <div
                  key={f.id}
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all',
                    i === activeIdx
                      ? 'border-[#FF5C39] bg-[#FF5C39]/[0.06] text-[#FF5C39] font-medium'
                      : 'border-[#E5E7EB] bg-white text-[#3D3A35] hover:border-[#5E5954]',
                  )}
                >
                  {f.preview ? <ImageIcon size={11} /> : <FileText size={11} />}
                  <span className="max-w-[140px] truncate">{f.file.name}</span>
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(f.id) }}
                    className="ml-1 hover:text-[#D32F2F] transition-colors"
                  >
                    <X size={10} />
                  </span>
                </div>
              ))}
              <div {...getRootProps()} onClick={(e) => e.stopPropagation()}>
                <input {...getInputProps()} />
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed border-[#E5E7EB] text-[#5E5954] hover:border-[#5E5954] text-xs transition-all"
                >
                  <Plus size={11} /> {t('upload.addMore')}
                </button>
              </div>
            </div>
          )}

          {/* 2. Product selector */}
          <div>
            <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest mb-2">{t('upload.selectProduct')}</p>
            <div className="relative">
              <div
                onClick={() => setShowProductList(v => !v)}
                className="w-full h-11 px-4 flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white cursor-pointer hover:border-[#5E5954] transition-colors"
              >
                {selectedProduct ? (
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <CheckCircle2 size={14} className="text-[#2E7D32] shrink-0" />
                    <span className="text-sm text-[#0A0A0F] truncate">
                      {selectedProduct.name} — SKU: {selectedProduct.sku}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-[#8C8782]">{t('upload.selectPlaceholder')}</span>
                )}
                <Package size={14} className="text-[#5E5954] shrink-0 ml-2" />
              </div>

              {showProductList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-20 overflow-hidden">
                  <div className="p-2 border-b border-[#FAFAFA]">
                    <input
                      autoFocus
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={t('products.searchPlaceholder')}
                      className="w-full h-8 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#FF5C39] focus:ring-1 focus:ring-[#FF5C39]/20"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {displayProducts
                      .filter(p =>
                        !productSearch ||
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedProduct(p); setShowProductList(false); setProductSearch('') }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFFFFF] transition-colors text-left border-b border-[#FAFAFA] last:border-0"
                        >
                          <Package size={12} className="text-[#5E5954] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-[#0A0A0F] font-medium truncate">{p.name}</p>
                            <p className="font-mono text-[9px] text-[#5E5954]">SKU: {p.sku}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Docs dropzone (multi-file) */}
          <div>
            <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest mb-1">{t('upload.docSection.label')}</p>
            <p className="text-[#5E5954] text-xs mb-3 leading-relaxed">{t('upload.docSection.hint')}</p>

            <div
              {...getDocRootProps()}
              className={cn(
                'w-full rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer py-8 flex flex-col items-center gap-2',
                isDocDrag
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/[0.04]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#8B5CF6] hover:bg-[#FFFFFF]',
              )}
            >
              <input {...getDocInputProps()} />
              <FileUp size={24} className={isDocDrag ? 'text-[#8B5CF6]' : 'text-[#5E5954]'} />
              <p className="text-sm text-[#3D3A35] font-medium">{t('upload.docSection.dropIdle')}</p>
              <p className="text-xs text-[#5E5954]">{t('upload.docSection.dropHint')}</p>
            </div>

            {refDocs.length > 0 && (
              <div className="mt-3 space-y-2">
                {refDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-[#E5E7EB]">
                    <FileText size={14} className="text-[#FF5C39] shrink-0" />
                    <span className="text-sm text-[#0A0A0F] flex-1 truncate">{doc.name}</span>
                    <span className="text-xs text-[#5E5954] font-mono shrink-0">{doc.size}</span>
                    <button
                      type="button"
                      onClick={() => setRefDocs(d => d.filter(x => x.id !== doc.id))}
                      className="text-[#5E5954] hover:text-[#D32F2F] transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-[#D32F2F] bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle size={13} className="shrink-0" /> {error}
            </div>
          )}

          {/* 4. CTA — prominent */}
          {isProcessing ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0A0A0F]">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full border-2 border-[#FF5C39]/20 border-t-[#FF5C39] animate-spin" />
                <Sparkles size={12} className="absolute inset-0 m-auto text-[#FF5C39]" />
              </div>
              <div>
                <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">{t('upload.analyzing').toUpperCase()}</p>
                <p className="text-xs text-[#3D3A35]">{t('upload.analyzeHint')}</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRun}
              disabled={!canRun}
              className={cn(
                'w-full h-14 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2.5',
                canRun
                  ? [
                    'bg-[#FF5C39] hover:bg-[#E54E2A] text-white',
                    'shadow-lg shadow-[#FF5C39]/30 hover:shadow-[#FF5C39]/50',
                    'hover:-translate-y-0.5 active:translate-y-0',
                    'ring-2 ring-[#FF5C39]/20 hover:ring-[#FF5C39]/40',
                  ].join(' ')
                  : 'bg-[#F0EDE6] text-[#8C8782] cursor-not-allowed',
              )}
            >
              <Sparkles size={17} className={canRun ? 'animate-pulse' : ''} />
              {t('upload.run')}
            </button>
          )}

          {!files.length && (
            <p className="text-center text-[10px] text-[#8C8782] -mt-2">{t('upload.noFile')}</p>
          )}
          {files.length > 0 && !selectedProduct && (
            <p className="text-center text-[10px] text-[#8C8782] -mt-2">{t('upload.noProduct')}</p>
          )}
        </div>

        {/* ── Right: preview ── */}
        <div className="sticky top-6">
          <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest mb-3">{t('upload.preview')}</p>

          {activeFile ? (
            <div className={cn(
              'relative bg-[#FAFAFA] rounded-2xl border overflow-hidden transition-all duration-300',
              isProcessing ? 'border-[#FF5C39]/50 ring-2 ring-[#FF5C39]/20' : 'border-[#E5E7EB]',
            )}>
              {isProcessing && (
                <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-[#0A0A0F]/85 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                  <div className="w-3 h-3 rounded-full border-2 border-[#FF5C39]/30 border-t-[#FF5C39] animate-spin shrink-0" />
                  <span className="font-mono text-[9px] text-[#8B5CF6] tracking-widest">AI ANALYZING</span>
                </div>
              )}
              {activeFile.isPdf ? (
                <embed src={activeFile.preview} type="application/pdf" className="w-full" style={{ height: 560 }} />
              ) : (
                <img src={activeFile.preview} alt="Preview" className="w-full object-contain max-h-[600px]" />
              )}
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 bg-[#0A0A0F]/75 backdrop-blur-sm rounded-lg px-3 py-1.5">
                {activeFile.isPdf ? <FileText size={11} className="text-[#c5c1b9] shrink-0" /> : <ImageIcon size={11} className="text-[#c5c1b9] shrink-0" />}
                <span className="text-[#c5c1b9] text-[10px] truncate flex-1">{activeFile.file.name}</span>
                <span className="text-[#3D3A35] text-[9px] shrink-0 font-mono">{formatBytes(activeFile.file.size)}</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#FAFAFA] rounded-2xl border-2 border-dashed border-[#E5E7EB] flex flex-col items-center justify-center py-20 px-6 text-center">
              <ImageIcon size={28} className="text-[#E5E7EB] mb-3" />
              <p className="text-[#8C8782] text-sm">{t('upload.uploadPreview')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

