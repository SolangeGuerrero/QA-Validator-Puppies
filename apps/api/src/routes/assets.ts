import { Router } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const canWrite = requireRole('admin', 'manager', 'reviewer')
import { uploadFileToStorage } from '../lib/insforge.js'
import { param } from '../lib/query.js'
import { asyncHandler } from '../lib/handler.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

// POST /creative-assets/upload
router.post('/upload', requireAuth, canWrite, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }
  if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
    res.status(400).json({ error: 'Only image or PDF files are allowed (JPEG, PNG, WebP, GIF, PDF)' })
    return
  }

  const { productId } = req.body as { productId?: string }
  if (!productId) { res.status(400).json({ error: 'productId is required' }); return }

  const assetId = uuidv4()
  const ext = req.file.originalname.split('.').pop() ?? 'jpg'
  const storagePath = `assets/${req.userId}/${assetId}.${ext}`

  const fileUrl = await uploadFileToStorage('creatives', storagePath, req.file.buffer, req.file.mimetype)

  const asset = await prisma.creativeAsset.create({
    data: {
      id: assetId,
      productId,
      userId: req.userId!,
      fileName: req.file.originalname,
      fileUrl,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      status: 'uploaded',
    },
  })

  res.status(201).json({ assetId: asset.id, previewUrl: fileUrl, asset })
}, 'Failed to upload asset'))

// GET /creative-assets/:id
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const asset = await prisma.creativeAsset.findUnique({
    where: { id: param(req, 'id') },
    include: { validations: { orderBy: { createdAt: 'desc' }, take: 5 } },
  })
  if (!asset) { res.status(404).json({ error: 'Asset not found' }); return }
  res.json(asset)
}, 'Failed to fetch asset'))

export default router
