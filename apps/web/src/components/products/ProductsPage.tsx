import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { ProductTable } from './ProductTable'
import { ProductFormModal } from './ProductFormModal'

export interface Product {
  id: string
  name: string
  sku: string
  brand: string
  category: string
  status: string
  createdAt: string
  _count?: { assets: number }
  documents?: Array<{ id: string; name: string; type: string; fileUrl: string }>
}

interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
}

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const { t } = useTranslation('app')

  const { data: brandsData } = useQuery<{ brand: string }[]>({
    queryKey: ['brands'],
    queryFn: () => api.get('/products/brands'),
    staleTime: 1000 * 60 * 5,
  })

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ['products', search, brandFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (brandFilter) params.set('brand', brandFilter)
      params.set('limit', '50')
      return api.get(`/products?${params}`)
    },
    placeholderData: { products: [], total: 0, page: 1, limit: 50 },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const handleEdit = (product: Product) => {
    setEditProduct(product)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setEditProduct(null)
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] text-[#5E5954] tracking-widest">{t('products.catalog')}</p>
          <p className="text-[#0A0A0F] font-semibold">{data?.total ?? 0} {t('products.products')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF5C39] hover:bg-[#E54E2A] text-white text-sm font-medium rounded-lg transition-all"
        >
          <Plus size={15} />
          {t('products.addProduct')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E5954]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('products.searchPlaceholder')}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#0A0A0F] placeholder:text-[#8C8782] outline-none focus:border-[#FF5C39] focus:ring-2 focus:ring-[#FF5C39]/10 transition-all"
          />
        </div>
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E5954]" />
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="h-9 pl-8 pr-6 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#3D3A35] outline-none focus:border-[#FF5C39] appearance-none cursor-pointer"
          >
            <option value="">{t('products.allBrands')}</option>
            {brandsData?.map(b => (
              <option key={b.brand} value={b.brand}>{b.brand}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <ProductTable
        products={data?.products ?? []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      {/* Modal */}
      {showModal && (
        <ProductFormModal
          product={editProduct}
          onClose={handleClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            handleClose()
          }}
        />
      )}
    </div>
  )
}
