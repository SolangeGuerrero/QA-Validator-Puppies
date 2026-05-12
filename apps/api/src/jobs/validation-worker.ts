import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { createHash } from 'crypto'
import { prisma } from '../lib/prisma.js'
import { getFileBuffer, uploadFileToStorage, insforgeAdmin } from '../lib/insforge.js'
import { getOrConvertPdfToPng } from '../lib/pdf-to-image.js'
import { validateCreativeWithGemini } from '../services/ai-engine/gemini.js'
import { retrieve, indexValidation } from '../services/rag.js'

// In-process async queue (replaces BullMQ to avoid Upstash REST/TCP mismatch)
export const validationQueue = {
  async add(_name: string, data: { validationId: string }, _opts?: unknown) {
    // Process in background without blocking the response
    processValidation(data.validationId).catch((err) => {
      console.error(`[Worker] Job failed:`, err.message ?? err)
    })
  },
}

async function processValidation(validationId: string) {
  try {
    await prisma.validation.update({
      where: { id: validationId },
      data: { status: 'running', startedAt: new Date() },
    })

    const validation = await prisma.validation.findUniqueOrThrow({
      where: { id: validationId },
      include: {
        asset: {
          include: {
            product: { include: { documents: true } },
          },
        },
      },
    })

    const { asset } = validation
    const { product } = asset

    // Download asset → convert PDF to PNG so AI gets a raster image with predictable coordinates
    const t0 = Date.now()
    const rawBuffer = await getFileBuffer(asset.fileUrl)
    console.log(`[Worker] ① download asset: ${Date.now() - t0}ms`)

    let imageBuffer = rawBuffer
    type SupportedMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf'
    let mediaType: SupportedMimeType = asset.fileType as SupportedMimeType

    if (asset.fileType === 'application/pdf') {
      const t1 = Date.now()
      console.log(`[Worker] ② converting PDF → PNG…`)
      // Timeout bumped to 120s — heavy artwork PDFs with embedded fonts can take a while.
      // Do NOT fall back to raw PDF: Gemini's MODEL_ARMOR safety filter often blocks raw PDFs
      // and returns empty content, which fails the validation with a misleading error.
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF→PNG timed out after 120s')), 120_000)
      )
      imageBuffer = await Promise.race([getOrConvertPdfToPng(rawBuffer, 1.0), timeout])
      mediaType   = 'image/png'
      console.log(`[Worker] ② PDF→PNG: ${Date.now() - t1}ms  (${Math.round(imageBuffer.length / 1024)}KB)`)
    }

    const imageBase64 = imageBuffer.toString('base64')
    console.log(`[Worker] image being sent: ${mediaType}  ${Math.round(imageBase64.length / 1024)}KB base64`)

    // Parse reference documents → text
    // Only use documents explicitly selected for this validation (uploaded in this flow).
    // Historical product.documents are ignored unless their id is in selectedDocumentIds.
    const t2 = Date.now()
    const documentTexts: string[] = []
    const documentsUsed: Array<{ id: string; name: string; type: string }> = []
    const selectedIds = validation.selectedDocumentIds ?? []
    const docsToUse = selectedIds.length > 0
      ? product.documents.filter(d => selectedIds.includes(d.id))
      : []
    for (const doc of docsToUse) {
      try {
        const docBuffer = await getFileBuffer(doc.fileUrl)
        const isDocx = doc.name.toLowerCase().endsWith('.docx') || doc.fileUrl.toLowerCase().includes('.docx')
        let text: string
        if (isDocx) {
          const result = await mammoth.extractRawText({ buffer: docBuffer })
          text = result.value
        } else {
          const parsed = await pdfParse(docBuffer)
          text = parsed.text
        }
        if (text.trim()) {
          documentTexts.push(`[${doc.name}]\n${text.slice(0, 4000)}`)
          documentsUsed.push({ id: doc.id, name: doc.name, type: doc.type })
        }
      } catch (err) {
        console.warn(`Failed to parse document ${doc.id}:`, err)
      }
    }
    console.log(`[Worker] ③ parse docs (${docsToUse.length} of ${product.documents.length}): ${Date.now() - t2}ms`)

    // Retrieve relevant past validation issues (RAG context)
    const ragQuery = `${product.name} ${product.brand} ${product.category} ${product.sku}`
    // Exclude the current product so a validation cannot see its own past output as "history" —
    // otherwise re-running the same artwork drifts because each run feeds the next one's prompt.
    const ragChunks = await retrieve(ragQuery, 8, product.id).catch(() => [])
    if (ragChunks.length > 0) {
      console.log(`[Worker] ③b RAG: ${ragChunks.length} relevant past issues retrieved`)
    }

    // Call AI Vision — provider selected via AI_PROVIDER env var (default: gemini)
    const t3 = Date.now()
    const provider = process.env.AI_PROVIDER ?? 'gemini'
    const productCtx = {
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      category: product.category,
    }
    const ragContext = ragChunks.map(c => c.content)

    // LLM response cache (content-addressable): same image + same docs + same RAG context →
    // same answer, every time. Eliminates residual Gemini Flash non-determinism and
    // MODEL_ARMOR retry variance. First validation pays the LLM cost; re-runs are free.
    const cacheKey = createHash('sha256')
      .update(provider)
      .update('\n')
      .update(imageBase64)
      .update('\n')
      .update(documentTexts.join('\n'))
      .update('\n')
      .update(ragContext.join('\n'))
      .digest('hex')
    const llmCachePath = `llm-cache/${cacheKey}.json`
    const llmCacheUrl = insforgeAdmin.storage.from('creatives').getPublicUrl(llmCachePath).data.publicUrl

    let result: Awaited<ReturnType<typeof validateCreativeWithGemini>>
    try {
      const cached = await getFileBuffer(llmCacheUrl)
      result = JSON.parse(cached.toString('utf8'))
      console.log(`[LLM] cache hit (${cacheKey.slice(0, 12)})`)
    } catch {
      console.log(`[LLM] cache miss (${cacheKey.slice(0, 12)}), calling ${provider}…`)
      result = await validateCreativeWithGemini(imageBase64, mediaType, productCtx, documentTexts, ragContext)
      uploadFileToStorage('creatives', llmCachePath, Buffer.from(JSON.stringify(result)), 'application/json')
        .catch(err => console.warn(`[LLM] failed to write cache:`, err))
    }

    const critical = result.issues.filter(i => i.severity === 'critical').length
    const warnings = result.issues.filter(i => i.severity === 'warning').length

    await prisma.validationIssue.createMany({
      data: result.issues.map(issue => ({
        validationId,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: issue.category,
        suggestion: issue.suggestion ?? null,
        status: 'open',
      })),
    })

    await prisma.validation.update({
      where: { id: validationId },
      data: {
        status: 'completed',
        complianceScore: result.complianceScore,
        summary: result.summary,
        totalIssues: critical,
        totalWarnings: warnings,
        totalPassed: result.passedChecks.length,
        documentsUsed,
        completedAt: new Date(),
      },
    })

    await prisma.creativeAsset.update({
      where: { id: asset.id },
      data: { status: 'validated' },
    })

    console.log(`[Worker] ④ AI call (${provider}): ${Date.now() - t3}ms  issues: ${result.issues.length}`)
    console.log(`[Worker] Validation ${validationId} completed — score: ${result.complianceScore} — total: ${Date.now() - t0}ms`)

    // Index results into RAG knowledge base (fire-and-forget)
    indexValidation(validationId).catch(err => console.warn('[RAG] Indexing failed:', err))
  } catch (error) {
    console.error(`[Worker] Validation ${validationId} failed:`, error)
    await prisma.validation.update({
      where: { id: validationId },
      data: { status: 'failed', completedAt: new Date() },
    }).catch(() => {})
    throw error
  }
}
