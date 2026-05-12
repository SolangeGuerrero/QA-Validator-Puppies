import { prisma } from '../lib/prisma.js'
import { embed } from './embeddings.js'

export interface RagChunk {
  content: string
  brand: string | null
  category: string | null
  severity: string | null
  created_at: Date
}

// Run once at startup — enables pgvector and creates the rag_chunks table
export async function setupRagSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content       TEXT NOT NULL,
      embedding     vector(768),
      validation_id TEXT REFERENCES validations(id) ON DELETE CASCADE,
      product_id    TEXT,
      brand         TEXT,
      category      TEXT,
      severity      TEXT,
      created_at    TIMESTAMPTZ DEFAULT now()
    )
  `)
  // ivfflat index only makes sense once we have enough rows; safe to call repeatedly
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS rag_chunks_embedding_idx
      ON rag_chunks USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
  `).catch(() => {
    // ivfflat requires at least 1 row — ignore error on empty table
  })
}

// Called fire-and-forget after a validation completes
export async function indexValidation(validationId: string): Promise<void> {
  const validation = await prisma.validation.findUnique({
    where: { id: validationId },
    include: {
      issues: true,
      asset: { include: { product: true } },
    },
  })
  if (!validation || validation.issues.length === 0) return

  const { asset } = validation
  const { product } = asset
  const dateStr = (validation.completedAt ?? validation.createdAt).toISOString().slice(0, 10)

  for (const issue of validation.issues) {
    const content = [
      `Producto: ${product.name} | Marca: ${product.brand} | Categoría: ${product.category} | SKU: ${product.sku}`,
      `Severidad: ${issue.severity} | Tipo: ${issue.category}`,
      `${issue.description}`,
      issue.suggestion ? `Corrección: ${issue.suggestion}` : '',
      `Score de compliance: ${validation.complianceScore ?? '—'} | Fecha: ${dateStr}`,
    ].filter(Boolean).join('\n')

    const vector = await embed(content)
    const vectorLiteral = `[${vector.join(',')}]`

    await prisma.$executeRawUnsafe(
      `INSERT INTO rag_chunks (content, embedding, validation_id, product_id, brand, category, severity)
       VALUES ($1, $2::vector, $3, $4, $5, $6, $7)`,
      content,
      vectorLiteral,
      validationId,
      product.id,
      product.brand,
      product.category,
      issue.severity,
    )
  }

  console.log(`[RAG] Indexed ${validation.issues.length} chunks for validation ${validationId}`)
}

// Returns the K most similar past issues for a product query.
// excludeProductId: when set, filters out chunks belonging to the current product so
// a validation cannot see its own past output as "history" (prevents self-feedback drift
// across re-runs of the same product, which makes results non-deterministic).
export async function retrieve(query: string, k = 8, excludeProductId?: string): Promise<RagChunk[]> {
  const vector = await embed(query)
  const vectorLiteral = `[${vector.join(',')}]`

  const rows = excludeProductId
    ? await prisma.$queryRawUnsafe<RagChunk[]>(
        `SELECT content, brand, category, severity, created_at, id
         FROM rag_chunks
         WHERE product_id IS DISTINCT FROM $2
         ORDER BY embedding <=> $1::vector ASC, created_at DESC, id ASC
         LIMIT $3`,
        vectorLiteral,
        excludeProductId,
        k,
      )
    : await prisma.$queryRawUnsafe<RagChunk[]>(
        `SELECT content, brand, category, severity, created_at, id
         FROM rag_chunks
         ORDER BY embedding <=> $1::vector ASC, created_at DESC, id ASC
         LIMIT $2`,
        vectorLiteral,
        k,
      )

  return rows
}
