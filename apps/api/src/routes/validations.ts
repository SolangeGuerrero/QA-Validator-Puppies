import { Router } from 'express'
import sgMail from '@sendgrid/mail'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const canWrite = requireRole('admin', 'manager', 'reviewer')
import { validationQueue } from '../jobs/validation-worker.js'
import { generateValidationReport } from '../services/report.js'
import { qs, param } from '../lib/query.js'
import { asyncHandler } from '../lib/handler.js'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const router = Router()

// POST /validations — create & enqueue
router.post('/', requireAuth, canWrite, asyncHandler(async (req, res) => {
  const { creativeAssetId, documentIds } = req.body as { creativeAssetId: string; documentIds?: string[] }
  if (!creativeAssetId) {
    res.status(400).json({ error: 'creativeAssetId is required' })
    return
  }

  const asset = await prisma.creativeAsset.findUnique({ where: { id: creativeAssetId } })
  if (!asset) { res.status(404).json({ error: 'Asset not found' }); return }

  // Only accept documentIds that belong to the asset's product
  let selectedDocumentIds: string[] = []
  if (documentIds && documentIds.length > 0) {
    const validDocs = await prisma.productDocument.findMany({
      where: { id: { in: documentIds }, productId: asset.productId },
      select: { id: true },
    })
    selectedDocumentIds = validDocs.map(d => d.id)
  }

  const validation = await prisma.validation.create({
    data: {
      creativeAssetId,
      userId: req.userId!,
      status: 'pending',
      selectedDocumentIds,
    },
  })

  await validationQueue.add('validate', { validationId: validation.id }, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
  })

  res.status(201).json({ validationId: validation.id, status: 'pending' })
}, 'Failed to create validation'))

// GET /validations/:id — poll for status + results
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const validation = await prisma.validation.findUnique({
    where: { id: param(req, 'id') },
    include: {
      issues: { orderBy: [{ severity: 'asc' }, { createdAt: 'asc' }] },
      asset: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              brand: true,
              documents: { select: { id: true, name: true, type: true } },
            },
          },
        },
      },
    },
  })
  if (!validation) { res.status(404).json({ error: 'Validation not found' }); return }
  res.json(validation)
}, 'Failed to fetch validation'))

// GET /validations — list for a product/asset (optionally filter by user)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const assetId = qs(req, 'assetId')
  const filterUserId = qs(req, 'userId')
  const limit = parseInt(qs(req, 'limit', '10'))
  const validations = await prisma.validation.findMany({
    where: {
      ...(filterUserId ? { userId: filterUserId } : {}),
      ...(assetId ? { creativeAssetId: assetId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      asset: {
        select: {
          fileName: true,
          fileUrl: true,
          product: { select: { brand: true, name: true } },
        },
      },
    },
  })

  // Enrich with user names (secondary lookup, no schema relation needed)
  const userIds = [...new Set(validations.map(v => v.userId))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))
  res.json(validations.map(v => ({ ...v, user: userMap[v.userId] ?? null })))
}, 'Failed to fetch validations'))

// POST /validations/:id/report — generate PDF
router.post('/:id/report', requireAuth, asyncHandler(async (req, res) => {
  const id = param(req, 'id')
  const pdfBuffer = await generateValidationReport(id)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="validation-report-${id}.pdf"`)
  res.send(pdfBuffer)
}, 'Failed to generate report'))

// POST /validations/:id/send-approval — email the report to approver
router.post('/:id/send-approval', requireAuth, canWrite, asyncHandler(async (req, res) => {
  const validationId = param(req, 'id')
  const { to, cc = [], note = '' } = req.body as { to: string; cc?: string[]; note?: string }

  if (!to) { res.status(400).json({ error: 'Recipient email (to) is required' }); return }

  const validation = await prisma.validation.findUnique({
    where: { id: validationId },
    include: { asset: { include: { product: true } } },
  })
  if (!validation) { res.status(404).json({ error: 'Validation not found' }); return }

  const pdfBuffer = await generateValidationReport(validationId)
  const { asset } = validation
  const score = validation.complianceScore ?? 0
  const scoreLabel = score >= 80 ? '✅ Aprobado' : score >= 60 ? '⚠️ Observaciones' : '❌ Requiere correcciones'

  const fromAddress = process.env.SENDGRID_FROM ?? 'Puppies QA <qa@puppies.dev>'

  await sgMail.send({
    from: fromAddress,
    to,
    cc: cc.length > 0 ? cc : undefined,
    subject: `[Puppies QA] Validación para aprobación — ${asset.product.name} (${asset.fileName})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#0A0A0F">
        <div style="background:#FF5C39;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">Puppies QA — Validación para Aprobación</h1>
        </div>
        <div style="background:#FAFAFA;padding:24px 32px">
          <p style="margin:0 0 16px"><strong>Producto:</strong> ${asset.product.name} (${asset.product.sku})</p>
          <p style="margin:0 0 16px"><strong>Archivo:</strong> ${asset.fileName}</p>
          <p style="margin:0 0 16px"><strong>Score de compliance:</strong> ${score}% — ${scoreLabel}</p>
          ${note ? `<p style="margin:0 0 16px"><strong>Nota del revisor:</strong><br/>${note.replace(/\n/g, '<br/>')}</p>` : ''}
          <p style="margin:0">El reporte de compliance detallado está adjunto a este email.</p>
        </div>
        <div style="background:#F3F4F6;padding:12px 32px;border-radius:0 0 12px 12px">
          <p style="margin:0;font-size:11px;color:#8C8782">Puppies QA — Sistema de Validación Creativa · Puppies</p>
        </div>
      </div>
    `,
    attachments: [{
      filename: `compliance-report-${validationId}.pdf`,
      content: pdfBuffer.toString('base64'),
      type: 'application/pdf',
      disposition: 'attachment',
    }],
  })

  res.json({ ok: true })
}, 'Failed to send email'))

export default router
