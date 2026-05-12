import { z } from 'zod'

export const IssuePositionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
})

export const ValidationIssueOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
  category: z.enum(['brand', 'legal', 'typography', 'color', 'regulatory', 'spacing']),
  suggestion: z.string().optional(),
  position: IssuePositionSchema.optional(),
})

export const ValidationOutputSchema = z.object({
  complianceScore: z.number().int().min(0).max(100),
  summary: z.string(),
  issues: z.array(ValidationIssueOutputSchema),
  passedChecks: z.array(z.string()),
})

export type ValidationOutput = z.infer<typeof ValidationOutputSchema>
export type ValidationIssueOutput = z.infer<typeof ValidationIssueOutputSchema>
