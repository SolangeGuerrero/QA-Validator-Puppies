// Shared domain types used across multiple components

export interface ValidationIssue {
  id: string
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  suggestion?: string
  status: string
}

export interface ProductDocument {
  id: string
  name: string
  type: string
}

export interface Product {
  id: string
  name: string
  sku: string
  brand: string
  category: string
  status?: string
  documents: ProductDocument[]
}

export interface ValidationData {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  complianceScore?: number
  summary?: string
  totalIssues: number
  totalWarnings: number
  totalPassed: number
  issues: ValidationIssue[]
  documentsUsed?: Array<{ id: string; name: string; type: string }>
  asset: {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    product: Product & {
      documents: ProductDocument[]
    }
  }
}

export interface ValidationListItem {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  complianceScore: number | null
  createdAt: string
  completedAt: string | null
  asset: {
    fileName: string
    fileUrl?: string
    product: { name: string; brand?: string }
  }
  user?: { id?: string; name: string; email: string }
}
