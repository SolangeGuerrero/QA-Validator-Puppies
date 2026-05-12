import { Pencil, Trash2, FileText, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from './ProductsPage'

interface ProductTableProps {
  products: Product[]
  isLoading: boolean
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductTable({ products, isLoading, onEdit, onDelete }: ProductTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-[#FAFAFA] last:border-0 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-[#FAFAFA]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-[#FAFAFA] rounded w-40" />
              <div className="h-2.5 bg-[#FAFAFA] rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] flex flex-col items-center justify-center py-16">
        <Package size={32} className="text-[#E5E7EB] mb-3" />
        <p className="text-[#5E5954] text-sm">No products found</p>
        <p className="text-[#8C8782] text-xs mt-1">Add your first product to get started</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_140px_100px_80px_80px] gap-4 px-4 py-3 bg-[#FAFAFA] border-b border-[#E5E7EB]">
        {['Product', 'SKU', 'Brand', 'Category', 'Docs', 'Actions'].map((h) => (
          <span key={h} className="font-mono text-[9px] text-[#5E5954] tracking-widest uppercase">{h}</span>
        ))}
      </div>

      {/* Rows */}
      {products.map((product) => (
        <div
          key={product.id}
          className="grid grid-cols-[1fr_120px_140px_100px_80px_80px] gap-4 px-4 py-3.5 border-b border-[#FAFAFA] last:border-0 hover:bg-[#FFFFFF] transition-colors items-center"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FF5C39]/10 flex items-center justify-center shrink-0">
              <Package size={13} className="text-[#FF5C39]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[#0A0A0F] font-medium truncate">{product.name}</p>
              <p className={cn(
                'text-[10px] font-mono mt-0.5',
                product.status === 'active' ? 'text-[#2E7D32]' : 'text-[#5E5954]',
              )}>
                {product.status}
              </p>
            </div>
          </div>

          <span className="font-mono text-xs text-[#3D3A35]">{product.sku}</span>
          <span className="text-xs text-[#3D3A35] truncate">{product.brand}</span>
          <span className="text-xs text-[#3D3A35] capitalize">{product.category}</span>

          <div className="flex items-center gap-1">
            <FileText size={12} className="text-[#5E5954]" />
            <span className="font-mono text-[10px] text-[#5E5954]">
              {product.documents?.length ?? 0}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(product)}
              className="w-6 h-6 rounded flex items-center justify-center text-[#5E5954] hover:text-[#3D3A35] hover:bg-[#FAFAFA] transition-all"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${product.name}"?`)) onDelete(product.id)
              }}
              className="w-6 h-6 rounded flex items-center justify-center text-[#5E5954] hover:text-[#D32F2F] hover:bg-red-50 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
