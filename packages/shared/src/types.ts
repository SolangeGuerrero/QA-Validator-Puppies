export type Severity = 'critical' | 'warning' | 'info'
export type ValidationStatus = 'pending' | 'running' | 'completed' | 'failed'
export type IssueStatus = 'open' | 'dismissed'
export type ProductStatus = 'active' | 'inactive' | 'archived'
export type DocumentType = 'brand_guide' | 'legal' | 'regulatory' | 'style_guide'
export type UserRole = 'admin' | 'analyst' | 'viewer'

export interface IssuePosition {
  x: number      // 0-1 normalized (left edge)
  y: number      // 0-1 normalized (top edge)
  width: number  // 0-1 normalized
  height: number // 0-1 normalized
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: string
}

export interface ProductDocument {
  id: string
  productId: string
  name: string
  type: DocumentType
  fileUrl: string
  createdAt: string
}

export interface Product {
  id: string
  name: string
  sku: string
  brand: string
  category: string
  status: ProductStatus
  documents?: ProductDocument[]
  createdAt: string
}

export interface CreativeAsset {
  id: string
  productId: string
  product?: Product
  userId: string
  fileName: string
  fileUrl: string
  fileType: string
  status: string
  createdAt: string
}

export interface ValidationIssue {
  id: string
  validationId: string
  title: string
  description: string
  severity: Severity
  category: string
  suggestion?: string
  positionX?: number
  positionY?: number
  positionW?: number
  positionH?: number
  status: IssueStatus
}

export interface Validation {
  id: string
  creativeAssetId: string
  asset?: CreativeAsset
  userId: string
  status: ValidationStatus
  complianceScore?: number
  totalIssues: number
  totalWarnings: number
  totalPassed: number
  issues?: ValidationIssue[]
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface DashboardMetrics {
  piecesAnalyzed: number
  piecesAnalyzedTrend: number
  errorsDetected: number
  errorsDetectedTrend: number
  approvalRate: number
  approvalRateTrend: number
  avgValidationTime: number
  avgValidationTimeTrend: number
  complianceScore: number
  hoursSaved: number
}

export interface MonthlyDataPoint {
  month: string
  validations: number
  errors: number
}

export interface ErrorCategory {
  category: string
  count: number
  percentage: number
  color: string
}

export interface TopIssue {
  rank: number
  title: string
  count: number
  severity: Severity
  category: string
}
