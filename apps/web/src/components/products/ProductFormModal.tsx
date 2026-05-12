import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import type { Product } from './ProductsPage'

interface ProductFormModalProps {
  product: Product | null
  onClose: () => void
  onSuccess: () => void
}

export function ProductFormModal({ product, onClose, onSuccess }: ProductFormModalProps) {
  const isEditing = !!product
  const [form, setForm] = useState({
    name:     product?.name     ?? '',
    sku:      product?.sku      ?? '',
    brand:    product?.brand    ?? '',
    category: product?.category ?? 'general',
    status:   product?.status   ?? 'active',
  })
  const [error, setError] = useState<string | null>(null)

  const { data: brandsData } = useQuery<{ brand: string }[]>({
    queryKey: ['brands'],
    queryFn: () => api.get('/products/brands'),
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const mutation = useMutation({
    mutationFn: () => isEditing
      ? api.put(`/products/${product.id}`, form)
      : api.post('/products', form),
    onSuccess,
    onError: (err: Error) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.name || !form.sku || !form.brand) {
      setError('All fields are required')
      return
    }
    setError(null)
    mutation.mutate()
  }

  const inputCls = 'w-full h-10 px-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#0A0A0F] outline-none focus:border-[#FF5C39] focus:ring-2 focus:ring-[#FF5C39]/10 transition-all'
  const labelCls = 'text-[10px] font-mono text-[#8B5CF6] tracking-widest'

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-6">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl z-10 animate-fade-in-up max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-[#FAFAFA]">
          <div>
            <h2 className="font-semibold text-lg text-[#0A0A0F]">
              {isEditing ? 'Editar Producto' : 'Agregar Producto'}
            </h2>
            <p className="text-xs text-[#5E5954] mt-0.5">
              {isEditing ? `SKU: ${product.sku}` : 'Completá los datos del nuevo producto'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#5E5954] hover:bg-[#FAFAFA] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          {error && (
            <p className="text-xs text-[#D32F2F] bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* Row 1: Name + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>NOMBRE DEL PRODUCTO</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Cat Chow Aegis Adult…"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="CC-AE-001"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 2: Brand */}
          <div className="space-y-1.5">
            <label className={labelCls}>MARCA</label>
            <input
              type="text"
              list="brands-list"
              value={form.brand}
              onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
              placeholder="Ej: Puppies Pro Plan…"
              className={inputCls}
            />
            <datalist id="brands-list">
              {brandsData?.map(b => <option key={b.brand} value={b.brand} />)}
            </datalist>
          </div>

          {/* Status — only when editing */}
          {isEditing && (
            <div className="space-y-1.5">
              <label className={labelCls}>ESTADO</label>
              <div className="flex gap-3">
                {['active', 'inactive'].map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={() => setForm(f => ({ ...f, status: s }))}
                      className="accent-[#FF5C39]"
                    />
                    <span className="text-sm text-[#3D3A35] capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-[#E5E7EB] text-sm text-[#3D3A35] hover:bg-[#FAFAFA] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-10 rounded-xl bg-[#FF5C39] hover:bg-[#E54E2A] disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
              ) : (isEditing ? 'Guardar cambios' : 'Agregar Producto')}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  , document.body)
}
