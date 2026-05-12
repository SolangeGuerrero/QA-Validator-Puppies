import PDFDocument from 'pdfkit'
import { prisma } from '../lib/prisma.js'

const Puppies_RED = '#FF5C39'
const DARK = '#0A0A0F'
const MUTED = '#8C8782'
const SECONDARY = '#5E5954'
const LIGHT_BG = '#F5F2E9'
const SUCCESS = '#2E7D32'
const WARNING_COLOR = '#F57C00'
const ERROR_COLOR = '#D32F2F'
const INFO_COLOR = '#1565C0'

function severityColor(severity: string): string {
  if (severity === 'critical') return ERROR_COLOR
  if (severity === 'warning') return WARNING_COLOR
  return INFO_COLOR
}

export async function generateValidationReport(validationId: string): Promise<Buffer> {
  const validation = await prisma.validation.findUniqueOrThrow({
    where: { id: validationId },
    include: {
      issues: { orderBy: [{ severity: 'asc' }] },
      asset: { include: { product: true } },
    },
  })

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const { width } = doc.page
    const contentWidth = width - 96 // 48px each side

    // ── Header ────────────────────────────────────────────────────────────────
    // Red accent bar
    doc.rect(0, 0, 8, doc.page.height).fill(Puppies_RED)

    doc.fontSize(18).fillColor(Puppies_RED).font('Helvetica-Bold').text('Puppies', 64, 48)
    doc.fontSize(7).fillColor(MUTED).font('Helvetica').text('CREATIVEGUARD — COMPLIANCE REPORT', 64, 70, { characterSpacing: 1.5 })
    doc.moveDown(0.5)

    // Report title
    doc.fontSize(20).fillColor(DARK).font('Helvetica-Bold')
      .text(validation.asset.product.name, 64)
    doc.fontSize(9).fillColor(SECONDARY).font('Helvetica')
      .text(`SKU: ${validation.asset.product.sku}  ·  Brand: ${validation.asset.product.brand}  ·  Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)

    doc.moveDown(1)

    // ── Score summary boxes ────────────────────────────────────────────────────
    const boxW = (contentWidth - 12) / 4
    const boxX = 48
    const boxY = doc.y
    const boxes = [
      { label: 'COMPLIANCE SCORE', value: `${validation.complianceScore ?? 0}%`, color: (validation.complianceScore ?? 0) >= 80 ? SUCCESS : WARNING_COLOR },
      { label: 'CRITICAL ISSUES', value: String(validation.totalIssues), color: ERROR_COLOR },
      { label: 'WARNINGS', value: String(validation.totalWarnings), color: WARNING_COLOR },
      { label: 'PASSED CHECKS', value: String(validation.totalPassed), color: SUCCESS },
    ]

    boxes.forEach((box, i) => {
      const x = boxX + i * (boxW + 4)
      doc.roundedRect(x, boxY, boxW, 60, 4).fill(LIGHT_BG)
      doc.fontSize(7).fillColor(MUTED).font('Helvetica').text(box.label, x + 10, boxY + 10, { width: boxW - 20, characterSpacing: 0.8 })
      doc.fontSize(24).fillColor(box.color).font('Helvetica-Bold').text(box.value, x + 10, boxY + 24)
    })

    doc.y = boxY + 72
    doc.x = 48

    // ── Summary ───────────────────────────────────────────────────────────────
    if (validation.summary) {
      doc.moveDown(0.5)
      doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text('Summary')
      doc.moveDown(0.3)
      doc.fontSize(9.5).fillColor(SECONDARY).font('Helvetica')
        .text(validation.summary, { width: contentWidth, lineGap: 3 })
      doc.moveDown(1)
    }

    // ── Issues ────────────────────────────────────────────────────────────────
    doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(`Issues Found  (${validation.issues.length})`)
    doc.moveDown(0.4)

    // Thin separator
    doc.moveTo(48, doc.y).lineTo(width - 48, doc.y).strokeColor('#DCD8CB').lineWidth(0.5).stroke()
    doc.moveDown(0.4)

    for (const [i, issue] of validation.issues.entries()) {
      const color = severityColor(issue.severity)
      const startY = doc.y

      // Issue number + title
      doc.fontSize(9.5).fillColor(DARK).font('Helvetica-Bold')
        .text(`${i + 1}.  ${issue.title}`, 48, startY, { width: contentWidth - 100 })

      // Severity badge (top-right)
      const badgeText = issue.severity.toUpperCase()
      const badgeW = 56
      doc.roundedRect(width - 48 - badgeW, startY - 1, badgeW, 14, 3).fill(color)
      doc.fontSize(6.5).fillColor('#FFFFFF').font('Helvetica-Bold')
        .text(badgeText, width - 48 - badgeW, startY + 2, { width: badgeW, align: 'center' })

      doc.moveDown(0.3)
      doc.fontSize(8.5).fillColor(SECONDARY).font('Helvetica')
        .text(issue.description, 60, doc.y, { width: contentWidth - 12, lineGap: 2 })

      if (issue.suggestion) {
        doc.moveDown(0.25)
        doc.fontSize(8.5).fillColor(SUCCESS).font('Helvetica-Oblique')
          .text(`→  ${issue.suggestion}`, 60, doc.y, { width: contentWidth - 12, lineGap: 2 })
      }

      doc.moveDown(0.6)

      // Thin separator between issues
      if (i < validation.issues.length - 1) {
        doc.moveTo(60, doc.y).lineTo(width - 48, doc.y).strokeColor('#EEEBE3').lineWidth(0.5).stroke()
        doc.moveDown(0.4)
      }

      // Add page if needed
      if (doc.y > doc.page.height - 80) {
        doc.addPage()
        doc.rect(0, 0, 8, doc.page.height).fill(Puppies_RED)
      }
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 36
    doc.fontSize(7).fillColor(MUTED).font('Helvetica')
      .text(
        'Puppies QA  ·  Confidential  ·  Generated by Claude Vision AI — for internal use only',
        48, footerY, { width: contentWidth, align: 'center' },
      )

    doc.end()
  })
}
