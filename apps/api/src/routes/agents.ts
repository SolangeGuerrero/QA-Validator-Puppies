import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /agents — provider status + validation stats
router.get('/', requireAuth, async (_req, res) => {
  const activeProvider = process.env.AI_PROVIDER ?? 'claude'

  const providers = [
    {
      id: 'claude',
      name: 'Anthropic Claude',
      model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
      origin: 'Anthropic',
      configured: !!(process.env.ANTHROPIC_API_KEY),
      active: 'claude' === activeProvider,
    },
  ]

  const [completedCount, aggResult, categoryRows] = await Promise.all([
    prisma.validation.count({ where: { status: 'completed' } }),
    prisma.validation.aggregate({
      where: { status: 'completed', complianceScore: { not: null } },
      _avg: { complianceScore: true },
    }),
    prisma.validationIssue.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ])

  res.json({
    activeProvider,
    providers,
    stats: {
      completedValidations: completedCount,
      avgScore: Math.round(aggResult._avg.complianceScore ?? 0),
      topCategory: categoryRows[0]?.category ?? null,
      totalIssuesFound: categoryRows.reduce((s, r) => s + r._count.id, 0),
    },
  })
})

export default router
