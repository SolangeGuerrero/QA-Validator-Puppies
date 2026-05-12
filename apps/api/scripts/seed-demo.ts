// Orchestrates the demo seed:
//   1. Create demo Auth users (admin + viewer) in Supabase Auth
//   2. Insert matching rows in `users` table with the right roles
//   3. Insert demo products
//   4. Generate + upload reference PDFs to Storage and create ProductDocument rows
//   5. Generate + upload artwork PNGs and create CreativeAsset rows
//   6. Enqueue ~10 validations (worker picks them up + runs Claude + indexes RAG)
//
// Idempotent: re-running upserts everything and skips duplicates.
import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'
import { insforgeAdmin, uploadFileToStorage } from '../src/lib/insforge.js'
import { validationQueue } from '../src/jobs/validation-worker.js'
import { DEMO_PRODUCTS } from './lib/fake-data.js'
import { buildProductDocPdf } from './generate-demo-docs.js'
import { buildArtworkPng } from './generate-demo-artworks.js'

const DEMO_USERS = [
  { email: 'admin@puppies.dev', password: 'Puppies2026!', name: 'Demo Admin',  role: 'admin'  as const },
  { email: 'demo@puppies.dev',  password: 'Demo2026!',    name: 'Demo Viewer', role: 'viewer' as const },
]

async function ensureUser(email: string, password: string, name: string, role: string): Promise<string> {
  // Check if user already exists in Supabase Auth
  const { data: existing } = await insforgeAdmin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const found = existing?.users?.find((u: { email?: string }) => u.email === email)
  let userId: string
  if (found) {
    userId = found.id
    console.log(`  [auth] reuse user ${email} (${userId})`)
  } else {
    const { data, error } = await insforgeAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name, role },
    })
    if (error || !data.user) throw new Error(`Failed to create ${email}: ${error?.message}`)
    userId = data.user.id
    console.log(`  [auth] created ${email} (${userId})`)
  }
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email, name, role },
    update: { name, role },
  })
  return userId
}

async function main() {
  console.log('▸ Step 1/6 — demo Auth users')
  const userIds: Record<string, string> = {}
  for (const u of DEMO_USERS) {
    userIds[u.role] = await ensureUser(u.email, u.password, u.name, u.role)
  }

  console.log('\n▸ Step 2/6 — products')
  const productMap: Record<string, string> = {}
  for (const p of DEMO_PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } })
    if (existing) {
      productMap[p.sku] = existing.id
      console.log(`  [product] reuse ${p.sku} (${existing.id})`)
    } else {
      const created = await prisma.product.create({
        data: { name: p.name, sku: p.sku, brand: p.brand, category: p.category, status: 'active' },
      })
      productMap[p.sku] = created.id
      console.log(`  [product] created ${p.sku} (${created.id})`)
    }
  }

  console.log('\n▸ Step 3/6 — reference PDFs')
  const docIdsBySku: Record<string, string[]> = {}
  for (const p of DEMO_PRODUCTS) {
    const productId = productMap[p.sku]
    // Skip if doc already exists
    const existingDocs = await prisma.productDocument.findMany({ where: { productId } })
    if (existingDocs.length > 0) {
      docIdsBySku[p.sku] = existingDocs.map(d => d.id)
      console.log(`  [doc] reuse ${existingDocs.length} doc(s) for ${p.sku}`)
      continue
    }
    const buf = await buildProductDocPdf(p)
    const path = `documents/${productId}/ficha-tecnica-${p.sku}.pdf`
    const fileUrl = await uploadFileToStorage('creatives', path, buf, 'application/pdf')
    const doc = await prisma.productDocument.create({
      data: { productId, name: `Ficha técnica ${p.sku}.pdf`, type: 'spec_sheet', fileUrl },
    })
    docIdsBySku[p.sku] = [doc.id]
    console.log(`  [doc] uploaded ${p.sku} (${Math.round(buf.length / 1024)}KB)`)
  }

  console.log('\n▸ Step 4/6 — artwork PNGs')
  const assetIds: Array<{ sku: string; view: string; id: string }> = []
  for (const p of DEMO_PRODUCTS) {
    const productId = productMap[p.sku]
    for (const view of ['front', 'back', 'side'] as const) {
      const fileName = `arte-${p.sku}-${view}.png`
      const existing = await prisma.creativeAsset.findFirst({
        where: { productId, fileName },
      })
      if (existing) {
        assetIds.push({ sku: p.sku, view, id: existing.id })
        console.log(`  [art] reuse ${p.sku}-${view}`)
        continue
      }
      const buf = await buildArtworkPng(p, view)
      const path = `assets/demo/${productId}/${fileName}`
      const fileUrl = await uploadFileToStorage('creatives', path, buf, 'image/png')
      const asset = await prisma.creativeAsset.create({
        data: {
          productId, userId: userIds['admin'],
          fileName, fileUrl, fileType: 'image/png', fileSize: buf.length,
          status: 'uploaded',
        },
      })
      assetIds.push({ sku: p.sku, view, id: asset.id })
      console.log(`  [art] uploaded ${p.sku}-${view} (${Math.round(buf.length / 1024)}KB)`)
    }
  }

  console.log('\n▸ Step 5/6 — enqueue validations')
  // Pick 8 assets to validate (skip 'side' to keep run time down) — 5 fronts + 3 backs
  const toValidate = assetIds.filter((a, i) => a.view === 'front' || (a.view === 'back' && i % 2 === 0)).slice(0, 8)
  const validationIds: string[] = []
  for (const a of toValidate) {
    // Don't double-run if a completed validation already exists for this asset
    const existing = await prisma.validation.findFirst({
      where: { creativeAssetId: a.id, status: { in: ['completed', 'running', 'pending'] } },
    })
    if (existing) {
      console.log(`  [val] skip ${a.sku}-${a.view} (already ${existing.status})`)
      continue
    }
    const v = await prisma.validation.create({
      data: {
        creativeAssetId: a.id,
        userId: userIds['admin'],
        status: 'pending',
        selectedDocumentIds: docIdsBySku[a.sku] ?? [],
      },
    })
    validationIds.push(v.id)
    await validationQueue.add('validate', { validationId: v.id }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    })
    console.log(`  [val] queued ${a.sku}-${a.view} → ${v.id}`)
  }

  console.log('\n▸ Step 6/6 — waiting for validations to complete (this calls Claude + indexes RAG)')
  if (validationIds.length === 0) {
    console.log('  no new validations to wait for')
  } else {
    const deadline = Date.now() + 6 * 60_000  // 6 min max
    while (Date.now() < deadline) {
      const done = await prisma.validation.count({
        where: { id: { in: validationIds }, status: { in: ['completed', 'failed'] } },
      })
      console.log(`  progress: ${done}/${validationIds.length}`)
      if (done === validationIds.length) break
      await new Promise(r => setTimeout(r, 10_000))
    }
  }

  console.log('\n✅ Seed complete')
  console.log('   Login as admin@puppies.dev / Puppies2026!')
  console.log('   Or click "Try the demo" to enter as demo@puppies.dev (viewer)')
  await prisma.$disconnect()
  // Give the worker a moment to finish indexing RAG (fire-and-forget)
  await new Promise(r => setTimeout(r, 3000))
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
