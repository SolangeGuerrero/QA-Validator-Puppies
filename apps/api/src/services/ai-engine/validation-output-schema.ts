import { z } from 'zod'

export const ValidationIssueOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
  category: z.enum(['ingredient', 'nutrition', 'codes', 'legal', 'brand', 'formatting', 'missing']),
  suggestion: z.string().optional(),
})

export const ValidationOutputSchema = z.object({
  complianceScore: z.number().int().min(0).max(100).nullable(),
  summary: z.string(),
  issues: z.array(ValidationIssueOutputSchema),
  passedChecks: z.array(z.string()),
})
