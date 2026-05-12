import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

// Writers: admin/manager/reviewer can mutate products + upload docs. Viewer is read-only.
const canWrite = requireRole('admin', 'manager', 'reviewer')
import { uploadFileToStorage } from '../lib/insforge.js'
import { qs, param } from '../lib/query.js'
import { asyncHandler } from '../lib/handler.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

// GET /products
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const search = qs(req, 'search')
  const brand = qs(req, 'brand')
  const status = qs(req, 'status')
  const page = parseInt(qs(req, 'page', '1'))
  const limit = parseInt(qs(req, 'limit', '20'))
  const skip = (page - 1) * limit

  const where = {
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(brand ? { brand } : {}),
    ...(status ? { status } : {}),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { documents: true, _count: { select: { assets: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ])

  res.json({ products, total, page, limit })
}, 'Failed to fetch products'))

// POST /products — keeps explicit try/catch for Prisma P2002 → 409 mapping
router.post('/', requireAuth, canWrite, async (req, res) => {
  try {
    const { name, sku, brand, category } = req.body as Record<string, string>
    if (!name || !sku || !brand || !category) {
      res.status(400).json({ error: 'Missing required fields: name, sku, brand, category' })
      return
    }
    const product = await prisma.product.create({ data: { name, sku, brand, category } })
    res.status(201).json(product)
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      res.status(409).json({ error: 'SKU already exists' })
      return
    }
    console.error('[POST /products]', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// GET /products/brands — summary grouped by brand
router.get('/brands', requireAuth, asyncHandler(async (_req, res) => {
  const brands = await prisma.product.groupBy({ by: ['brand'], _count: { id: true } })
  const result = await Promise.all(brands.map(async ({ brand, _count }) => {
    const assetCount = await prisma.creativeAsset.count({ where: { product: { brand } } })
    const completedValidations = await prisma.validation.findMany({
      where: { status: 'completed', asset: { product: { brand } }, complianceScore: { not: null } },
      select: { complianceScore: true },
    })
    const avgScore = completedValidations.length > 0
      ? Math.round(completedValidations.reduce((sum, v) => sum + (v.complianceScore ?? 0), 0) / completedValidations.length)
      : null
    return { brand, productCount: _count.id, assetCount, avgScore }
  }))
  res.json(result)
}, 'Failed to fetch brands'))

// GET /products/:id
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: param(req, 'id') },
    include: { documents: true, assets: { orderBy: { createdAt: 'desc' }, take: 10 } },
  })
  if (!product) { res.status(404).json({ error: 'Product not found' }); return }
  res.json(product)
}, 'Failed to fetch product'))

// PUT /products/:id
router.put('/:id', requireAuth, canWrite, asyncHandler(async (req, res) => {
  const { name, sku, brand, category, status } = req.body as Record<string, string>
  const product = await prisma.product.update({
    where: { id: param(req, 'id') },
    data: { name, sku, brand, category, status },
  })
  res.json(product)
}, 'Failed to update product'))

// DELETE /products/:id
router.delete('/:id', requireAuth, canWrite, asyncHandler(async (req, res) => {
  const id = param(req, 'id')
  const assets = await prisma.creativeAsset.findMany({ where: { productId: id }, select: { id: true } })
  const assetIds = assets.map(a => a.id)
  if (assetIds.length > 0) {
    await prisma.validation.deleteMany({ where: { creativeAssetId: { in: assetIds } } })
    await prisma.creativeAsset.deleteMany({ where: { id: { in: assetIds } } })
  }
  await prisma.product.delete({ where: { id } })
  res.status(204).send()
}, 'Failed to delete product'))

// POST /products/:id/documents — upload reference doc (PDF/DOCX)
router.post('/:id/documents', requireAuth, canWrite, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }
  const { name, type } = req.body as Record<string, string>

  const path = `documents/${param(req, 'id')}/${Date.now()}-${req.file.originalname}`
  const fileUrl = await uploadFileToStorage('creatives', path, req.file.buffer, req.file.mimetype)

  const doc = await prisma.productDocument.create({
    data: {
      productId: param(req, 'id'),
      name: name ?? req.file.originalname,
      type: type ?? 'brand_guide',
      fileUrl,
    },
  })
  res.status(201).json(doc)
}, 'Failed to upload document'))

// DELETE /products/:id/documents/:docId
router.delete('/:id/documents/:docId', requireAuth, canWrite, asyncHandler(async (req, res) => {
  await prisma.productDocument.delete({ where: { id: param(req, 'docId') } })
  res.status(204).send()
}, 'Failed to delete document'))

export default router
