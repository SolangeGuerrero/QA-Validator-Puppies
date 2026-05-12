// Generates one PDF reference document per demo product using pdfkit.
// PDFs follow a SENASA-style technical sheet layout. They become the "source of truth"
// the AI compares the artwork against.

import PDFDocument from 'pdfkit'
import { DEMO_PRODUCTS, LEGAL_TEXT, type DemoProduct } from './lib/fake-data.js'

const CORAL = '#FF5C39'
const VIOLET = '#8B5CF6'
const TEXT = '#0A0A0F'
const MUTED = '#6B7280'

export async function buildProductDocPdf(product: DemoProduct): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Ficha técnica — ${product.name}`,
      Author: 'Puppies S.A.',
      Subject: 'SENASA reference document',
    },
  })

  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  // ── Header ─────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 80).fill(CORAL)
  doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('PUPPIES', 50, 28, { characterSpacing: 2 })
  doc.fontSize(9).font('Helvetica').text('FICHA TÉCNICA — SENASA', 50, 55, { characterSpacing: 4 })

  doc.moveDown(2)
  doc.fillColor(TEXT).fontSize(18).font('Helvetica-Bold').text(product.name, 50, 110)
  doc.fontSize(10).fillColor(MUTED).font('Helvetica').text(`${product.category} · ${product.lifeStage}`)

  // ── Metadata box ──────────────────────────────────────────────────────
  let y = 160
  doc.rect(50, y, doc.page.width - 100, 80).strokeColor('#E5E7EB').lineWidth(1).stroke()
  const col1 = 65, col2 = 320
  doc.fontSize(9).fillColor(MUTED).font('Helvetica-Bold')
  doc.text('SKU', col1, y + 12).text('SENASA REG.', col1, y + 32).text('EAN-13', col1, y + 52)
  doc.text('SAP CODE', col2, y + 12).text('PESO NETO', col2, y + 32).text('FABRICANTE', col2, y + 52)
  doc.fontSize(11).fillColor(TEXT).font('Helvetica')
  doc.text(product.sku, col1 + 90, y + 12).text(product.senasaReg, col1 + 90, y + 32).text(product.ean13, col1 + 90, y + 52)
  doc.text(product.sapCode, col2 + 90, y + 12).text(product.packWeight, col2 + 90, y + 32).text('Puppies S.A.', col2 + 90, y + 52)

  // ── Ingredients ───────────────────────────────────────────────────────
  y = 270
  doc.fillColor(VIOLET).fontSize(11).font('Helvetica-Bold').text('INGREDIENTES (orden descendente por peso)', 50, y)
  doc.moveTo(50, y + 16).lineTo(doc.page.width - 50, y + 16).strokeColor(VIOLET).stroke()
  doc.fillColor(TEXT).fontSize(10).font('Helvetica').text(product.ingredients.join(', ') + '.', 50, y + 24, {
    width: doc.page.width - 100,
    lineGap: 2,
  })

  // ── Nutritional table ─────────────────────────────────────────────────
  y = doc.y + 24
  doc.fillColor(VIOLET).fontSize(11).font('Helvetica-Bold').text('ANÁLISIS NUTRICIONAL', 50, y)
  doc.moveTo(50, y + 16).lineTo(doc.page.width - 50, y + 16).strokeColor(VIOLET).stroke()

  const rows: [string, string][] = [
    ['Proteína bruta (mín.)',          `${product.nutrition.crude_protein_min_pct}%`],
    ['Grasa bruta (mín.)',              `${product.nutrition.crude_fat_min_pct}%`],
    ['Fibra bruta (máx.)',              `${product.nutrition.crude_fiber_max_pct}%`],
    ['Humedad (máx.)',                  `${product.nutrition.moisture_max_pct}%`],
    ['Cenizas totales (máx.)',          `${product.nutrition.ash_max_pct}%`],
    ['Calcio (mín.)',                   `${product.nutrition.calcium_min_pct}%`],
    ['Fósforo (mín.)',                  `${product.nutrition.phosphorus_min_pct}%`],
    ['Energía metabolizable',           `${product.nutrition.metabolizable_energy_kcal_per_kg} kcal/kg`],
  ]
  y += 28
  for (const [label, value] of rows) {
    doc.fontSize(10).fillColor(TEXT).font('Helvetica').text(label, 65, y)
    doc.font('Helvetica-Bold').text(value, 380, y, { width: 120, align: 'right' })
    y += 18
  }

  // ── Storage + legal ────────────────────────────────────────────────────
  y += 12
  doc.fillColor(VIOLET).fontSize(11).font('Helvetica-Bold').text('CONSERVACIÓN', 50, y)
  doc.moveTo(50, y + 16).lineTo(doc.page.width - 50, y + 16).strokeColor(VIOLET).stroke()
  doc.fillColor(TEXT).fontSize(10).font('Helvetica').text(LEGAL_TEXT.storage, 50, y + 24, { width: doc.page.width - 100 })

  y = doc.y + 16
  doc.fillColor(VIOLET).fontSize(11).font('Helvetica-Bold').text('MODO DE EMPLEO', 50, y)
  doc.moveTo(50, y + 16).lineTo(doc.page.width - 50, y + 16).strokeColor(VIOLET).stroke()
  doc.fillColor(TEXT).fontSize(10).font('Helvetica').text(LEGAL_TEXT.feeding, 50, y + 24, { width: doc.page.width - 100 })

  // ── Footer ────────────────────────────────────────────────────────────
  doc.fontSize(8).fillColor(MUTED).font('Helvetica-Oblique').text(
    LEGAL_TEXT.warning + ' ' + LEGAL_TEXT.manufacturer,
    50, doc.page.height - 70,
    { width: doc.page.width - 100, align: 'center' },
  )
  doc.fontSize(7).fillColor(MUTED).font('Helvetica').text(
    'Documento generado para fines de demostración — Puppies QA portfolio project',
    50, doc.page.height - 50,
    { width: doc.page.width - 100, align: 'center' },
  )

  doc.end()
  return done
}

// CLI entry — write to /tmp for inspection
if (process.argv[1]?.endsWith('generate-demo-docs.ts')) {
  const fs = await import('fs/promises')
  for (const product of DEMO_PRODUCTS) {
    const buf = await buildProductDocPdf(product)
    const path = `/tmp/puppies-doc-${product.sku}.pdf`
    await fs.writeFile(path, buf)
    console.log(`✅ ${path} (${Math.round(buf.length / 1024)}KB)`)
  }
}
