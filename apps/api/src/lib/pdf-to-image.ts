import { createHash } from 'crypto'
import { spawn } from 'child_process'
import { insforgeAdmin, uploadFileToStorage, getFileBuffer } from './insforge.js'

// Render the first page of a PDF to PNG using poppler's pdftoppm (native binary).
// scale=1.5 → DPI 150*1.5=225. We use DPI directly so the output is consistent.
// pdftoppm reads PDF from stdin (-) and writes PNG to stdout when no prefix is given.
// Deterministic: same PDF → exact same PNG bytes.
export async function pdfFirstPageToPng(pdfBuffer: Buffer, scale = 1.5): Promise<Buffer> {
  const dpi = Math.round(150 * scale)
  return new Promise<Buffer>((resolve, reject) => {
    const proc = spawn('pdftoppm', ['-png', '-r', String(dpi), '-f', '1', '-l', '1', '-singlefile', '-'])
    const chunks: Buffer[] = []
    const errChunks: Buffer[] = []
    proc.stdout.on('data', (c: Buffer) => chunks.push(c))
    proc.stderr.on('data', (c: Buffer) => errChunks.push(c))
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0) {
        const stderr = Buffer.concat(errChunks).toString('utf8')
        return reject(new Error(`pdftoppm exited ${code}: ${stderr}`))
      }
      resolve(Buffer.concat(chunks))
    })
    proc.stdin.write(pdfBuffer)
    proc.stdin.end()
  })
}

// Content-addressable cache for PDF→PNG conversions.
// Why: node-canvas + pdfjs render is non-deterministic at sub-pixel level, so the same
// PDF converted twice gives slightly different PNG bytes — enough to make Gemini Flash
// return different issue counts between runs. Caching by SHA-256 of the PDF guarantees
// every re-run of the same PDF gets byte-identical input to the LLM.
const CACHE_BUCKET = 'creatives'
const CACHE_PREFIX = 'converted'

export async function getOrConvertPdfToPng(pdfBuffer: Buffer, scale = 1.5): Promise<Buffer> {
  const hash = createHash('sha256').update(pdfBuffer).digest('hex')
  const cachePath = `${CACHE_PREFIX}/${hash}.png`

  const { data } = insforgeAdmin.storage.from(CACHE_BUCKET).getPublicUrl(cachePath)
  const cacheUrl = data.publicUrl

  try {
    const cached = await getFileBuffer(cacheUrl)
    console.log(`[PDF→PNG] cache hit (${hash.slice(0, 12)})`)
    return cached
  } catch {
    console.log(`[PDF→PNG] cache miss (${hash.slice(0, 12)}), converting…`)
  }

  const png = await pdfFirstPageToPng(pdfBuffer, scale)
  try {
    await uploadFileToStorage(CACHE_BUCKET, cachePath, png, 'image/png')
  } catch (err) {
    console.warn(`[PDF→PNG] failed to write cache:`, err)
  }
  return png
}
