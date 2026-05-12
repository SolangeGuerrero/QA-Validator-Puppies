import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/handler.js'

const router = Router()

// GET /dashboard/metrics
router.get('/metrics', requireAuth, asyncHandler(async (_req, res) => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  const [
    totalValidations,
    completedValidations,
    recentValidations,
    avgScoreResult,
    issuesByCategory,
    monthlyValidations,
    topIssues,
  ] = await Promise.all([
    prisma.validation.count(),
    prisma.validation.count({ where: { status: 'completed' } }),
    prisma.validation.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.validation.aggregate({
      where: { status: 'completed' },
      _avg: { complianceScore: true },
    }),
    prisma.validationIssue.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    // Monthly validation counts for last 12 months
    prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT to_char(date_trunc('month', "created_at"), 'Mon') as month,
             COUNT(*) as count
      FROM validations
      WHERE created_at >= ${twelveMonthsAgo}
      GROUP BY date_trunc('month', "created_at")
      ORDER BY date_trunc('month', "created_at")
    `,
    // Top recurring issues
    prisma.validationIssue.groupBy({
      by: ['title', 'severity'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  const passRate = completedValidations > 0
    ? Math.round((completedValidations / totalValidations) * 100)
    : 0

  res.json({
    totalValidations,
    completedValidations,
    recentValidations,
    averageComplianceScore: Math.round(avgScoreResult._avg.complianceScore ?? 0),
    passRate,
    issuesByCategory: issuesByCategory.map((c: { category: string | null; _count: { id: number } }) => ({
      category: c.category as string,
      count: c._count.id,
    })),
    monthlyData: (monthlyValidations as Array<{ month: string; count: bigint }>).map((m) => ({
      month: m.month,
      count: Number(m.count),
    })),
    topIssues: topIssues.map((t: { title: string | null; severity: string | null; _count: { id: number } }) => ({
      title: t.title as string,
      severity: t.severity as string,
      count: t._count.id,
    })),
  })
}, 'Failed to fetch metrics'))

export default router
