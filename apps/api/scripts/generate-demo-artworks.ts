// Generates 3 PNG packaging artworks per product (front / back / side panel) using node-canvas.
// Artworks deliberately introduce 2-3 compliance errors vs the reference doc, so the AI
// has real discrepancies to surface in the dashboard.

import { createCanvas, type CanvasRenderingContext2D } from 'canvas'
import { DEMO_PRODUCTS, LEGAL_TEXT, type DemoProduct } from './lib/fake-data.js'

type View = 'front' | 'back' | 'side'

const W = 800
const H = 1200
const CORAL = '#FF5C39'
const VIOLET = '#8B5CF6'
const DARK = '#0A0A0F'
const CREAM = '#FFF8F0'
const PAW_BG = '#FFFFFF'

// ── Helpers ──────────────────────────────────────────────────────────────
function gradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, CORAL)
  g.addColorStop(1, VIOLET)
  return g
}

function drawPaw(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale = 1, color = PAW_BG) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(scale, scale)
  ctx.fillStyle = color
  // main pad
  ctx.beginPath()
  ctx.ellipse(0, 18, 30, 22, 0, 0, Math.PI * 2)
  ctx.fill()
  // 4 toes
  for (const [dx, dy, r] of [[-22, -14, 11], [-7, -22, 12], [9, -20, 11], [22, -10, 10]] as const) {
    ctx.beginPath()
    ctx.arc(dx, dy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(/\s+/)
  let line = ''
  let yy = y
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth) {
      ctx.fillText(line, x, yy)
      line = w
      yy += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, yy)
  return yy
}

// ── FRONT ────────────────────────────────────────────────────────────────
function drawFront(ctx: CanvasRenderingContext2D, p: DemoProduct) {
  // Background gradient (top→bottom: coral→violet)
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, CORAL)
  bg.addColorStop(1, VIOLET)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Big paw watermark
  ctx.globalAlpha = 0.08
  drawPaw(ctx, W / 2, H / 2, 5)
  ctx.globalAlpha = 1

  // Brand wordmark — INTENTIONAL TYPO for PUP-SLM-003
  const brandLabel = p.sku === 'PUP-SLM-003' ? 'PUPIES' : 'PUPPIES'
  ctx.fillStyle = 'white'
  ctx.font = 'bold 96px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(brandLabel, W / 2, 220)

  // Small paw above wordmark
  drawPaw(ctx, W / 2, 110, 1.4, 'white')

  // Product name
  ctx.font = 'bold 56px sans-serif'
  ctx.fillText(p.name.replace(/^Puppies /, ''), W / 2, 320)

  // Variant
  ctx.font = '30px sans-serif'
  ctx.fillText(`con ${p.variant}`, W / 2, 380)

  // Life stage badge
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(W / 2 - 240, 440, 480, 60)
  ctx.fillStyle = 'white'
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText(p.lifeStage.toUpperCase(), W / 2, 478)

  // Hero product placeholder — abstract food bowl
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.ellipse(W / 2, 720, 200, 80, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FBBF24'
  ctx.beginPath()
  ctx.ellipse(W / 2, 690, 180, 60, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  // Kibble dots
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI - Math.PI / 6
    const x = W / 2 + Math.cos(a) * 150
    const yy = 690 + Math.sin(a) * 50
    ctx.fillStyle = '#A16207'
    ctx.beginPath()
    ctx.arc(x, yy, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  // Pack weight — INTENTIONAL ERROR for PUP-SMB-005
  const weightLabel = p.sku === 'PUP-SMB-005' ? '1 kg' : p.packWeight
  ctx.fillStyle = 'white'
  ctx.font = 'bold 70px sans-serif'
  ctx.fillText(weightLabel, W / 2, 940)
  ctx.font = '20px sans-serif'
  ctx.fillText('PESO NETO', W / 2, 970)

  // SENASA on front — INTENTIONAL TYPO for PUP-CHK-001
  ctx.font = '18px sans-serif'
  ctx.textAlign = 'left'
  const senasaLabel = p.sku === 'PUP-CHK-001' ? 'A.18342' : p.senasaReg
  ctx.fillText(`Reg. SENASA ${senasaLabel}`, 50, H - 60)

  // EAN-13 representation — INTENTIONAL ERROR for PUP-LMB-002 (mutate digit 7)
  ctx.textAlign = 'right'
  const eanLabel = p.sku === 'PUP-LMB-002'
    ? p.ean13.slice(0, 6) + ((Number(p.ean13[6]) + 5) % 10) + p.ean13.slice(7)
    : p.ean13
  ctx.fillText(eanLabel, W - 50, H - 60)
}

// ── BACK (ingredients + nutrition table) ────────────────────────────────
function drawBack(ctx: CanvasRenderingContext2D, p: DemoProduct) {
  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, W, H)

  // Header bar
  ctx.fillStyle = gradient(ctx, 0, 0, W, 80)
  ctx.fillRect(0, 0, W, 80)
  ctx.fillStyle = 'white'
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('PUPPIES', 40, 50)
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(p.name.toUpperCase(), W - 40, 50)

  // Ingredients header
  ctx.fillStyle = VIOLET
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('INGREDIENTES', 40, 130)
  ctx.fillStyle = DARK
  ctx.font = '14px sans-serif'

  // INTENTIONAL ERROR: omit 'Linaza' from ingredients for PUP-SNS-004
  const ingredients = p.sku === 'PUP-SNS-004'
    ? p.ingredients.filter(i => i.toLowerCase() !== 'linaza')
    : p.ingredients

  let y = wrap(ctx, ingredients.join(', ') + '.', 40, 160, W - 80, 22)

  // Nutritional table
  y += 40
  ctx.fillStyle = VIOLET
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText('COMPOSICIÓN ANALÍTICA', 40, y)
  y += 30

  // INTENTIONAL ERRORS for back:
  // PUP-CHK-001: crude_protein 28% instead of 30%
  // PUP-LMB-002: crude_fat 18% instead of 16%
  // PUP-SMB-005: ME 3800 instead of 4000 kcal/kg
  const protein = p.sku === 'PUP-CHK-001' ? 28 : p.nutrition.crude_protein_min_pct
  const fat = p.sku === 'PUP-LMB-002' ? 18 : p.nutrition.crude_fat_min_pct
  const me = p.sku === 'PUP-SMB-005' ? 3800 : p.nutrition.metabolizable_energy_kcal_per_kg

  const rows: [string, string][] = [
    ['Proteína bruta (mín.)',  `${protein}%`],
    ['Grasa bruta (mín.)',      `${fat}%`],
    ['Fibra bruta (máx.)',      `${p.nutrition.crude_fiber_max_pct}%`],
    ['Humedad (máx.)',          `${p.nutrition.moisture_max_pct}%`],
    ['Cenizas (máx.)',          `${p.nutrition.ash_max_pct}%`],
    ['Calcio (mín.)',           `${p.nutrition.calcium_min_pct}%`],
    ['Fósforo (mín.)',          `${p.nutrition.phosphorus_min_pct}%`],
    ['Energía metabolizable',   `${me} kcal/kg`],
  ]

  ctx.font = '15px sans-serif'
  for (const [label, value] of rows) {
    ctx.fillStyle = DARK
    ctx.fillText(label, 60, y)
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(value, W - 60, y)
    ctx.font = '15px sans-serif'
    ctx.textAlign = 'left'
    ctx.strokeStyle = '#E5E7EB'
    ctx.beginPath()
    ctx.moveTo(40, y + 8)
    ctx.lineTo(W - 40, y + 8)
    ctx.stroke()
    y += 28
  }

  // Storage — INTENTIONAL DIFFERENT WORDING for PUP-SNS-004
  y += 24
  ctx.fillStyle = VIOLET
  ctx.font = 'bold 18px sans-serif'
  ctx.fillText('CONSERVACIÓN', 40, y)
  y += 24
  ctx.fillStyle = DARK
  ctx.font = '13px sans-serif'
  const storage = p.sku === 'PUP-SNS-004'
    ? 'Almacenar en un lugar fresco. Cerrar bien después de abrir.'
    : LEGAL_TEXT.storage
  y = wrap(ctx, storage, 40, y, W - 80, 18)

  // Footer
  ctx.fillStyle = '#6B7280'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(LEGAL_TEXT.manufacturer, W / 2, H - 30)
}

// ── SIDE PANEL (feeding chart) ──────────────────────────────────────────
function drawSide(ctx: CanvasRenderingContext2D, p: DemoProduct) {
  ctx.fillStyle = DARK
  ctx.fillRect(0, 0, W, H)

  // Header
  ctx.fillStyle = gradient(ctx, 0, 0, W, 0)
  ctx.fillRect(0, 0, W, 6)

  drawPaw(ctx, 80, 90, 1.6, 'white')
  ctx.fillStyle = 'white'
  ctx.font = 'bold 36px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('PUPPIES', 150, 100)
  ctx.font = '16px sans-serif'
  ctx.fillStyle = '#9CA3AF'
  ctx.fillText(p.name, 150, 128)

  // Big section title
  ctx.fillStyle = 'white'
  ctx.font = 'bold 32px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('RACIONES DIARIAS', W / 2, 220)

  // Feeding table
  const headers = ['Peso del cachorro', 'Cantidad diaria']
  const rows = [
    ['2-5 kg',  '40-90 g'],
    ['5-10 kg', '90-160 g'],
    ['10-20 kg','160-280 g'],
    ['20-30 kg','280-400 g'],
    ['+30 kg',  '400-520 g'],
  ]

  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(80, 270, W - 160, 50 + rows.length * 50)

  ctx.fillStyle = CORAL
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(headers[0], 110, 305)
  ctx.textAlign = 'right'
  ctx.fillText(headers[1], W - 110, 305)

  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath()
  ctx.moveTo(100, 320)
  ctx.lineTo(W - 100, 320)
  ctx.stroke()

  ctx.fillStyle = 'white'
  ctx.font = '18px sans-serif'
  rows.forEach((r, i) => {
    const yy = 360 + i * 44
    ctx.textAlign = 'left'
    ctx.fillText(r[0], 110, yy)
    ctx.textAlign = 'right'
    ctx.fillText(r[1], W - 110, yy)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.moveTo(100, yy + 12)
    ctx.lineTo(W - 100, yy + 12)
    ctx.stroke()
  })

  // Pack info section
  let yy = 700
  ctx.fillStyle = CORAL
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('SKU', 80, yy)
  ctx.fillText('SENASA', 80, yy + 60)
  ctx.fillText('SAP', 80, yy + 120)
  ctx.fillStyle = 'white'
  ctx.font = '18px sans-serif'
  ctx.fillText(p.sku, 80, yy + 28)
  ctx.fillText(p.senasaReg, 80, yy + 88)
  // INTENTIONAL ERROR: missing SAP code for PUP-SLM-003
  ctx.fillText(p.sku === 'PUP-SLM-003' ? '—' : p.sapCode, 80, yy + 148)

  // Storage instructions — INTENTIONAL MISSING for PUP-CHK-001
  if (p.sku !== 'PUP-CHK-001') {
    yy = 940
    ctx.fillStyle = CORAL
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('CONSERVACIÓN', 80, yy)
    ctx.fillStyle = '#D1D5DB'
    ctx.font = '13px sans-serif'
    wrap(ctx, LEGAL_TEXT.storage, 80, yy + 22, W - 160, 18)
  }

  // Footer
  ctx.fillStyle = '#6B7280'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(LEGAL_TEXT.manufacturer + ' · ' + LEGAL_TEXT.warning, W / 2, H - 30)
}

// ── Main ─────────────────────────────────────────────────────────────────
export async function buildArtworkPng(product: DemoProduct, view: View): Promise<Buffer> {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  if (view === 'front') drawFront(ctx, product)
  else if (view === 'back') drawBack(ctx, product)
  else drawSide(ctx, product)
  return canvas.toBuffer('image/png')
}

// CLI entry
if (process.argv[1]?.endsWith('generate-demo-artworks.ts')) {
  const fs = await import('fs/promises')
  for (const product of DEMO_PRODUCTS) {
    for (const view of ['front', 'back', 'side'] as View[]) {
      const buf = await buildArtworkPng(product, view)
      const path = `/tmp/puppies-art-${product.sku}-${view}.png`
      await fs.writeFile(path, buf)
      console.log(`✅ ${path} (${Math.round(buf.length / 1024)}KB)`)
    }
  }
}
