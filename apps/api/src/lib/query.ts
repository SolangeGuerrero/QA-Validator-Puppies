import type { Request } from 'express'

/** Safely read a single string value from express query params */
export function qs(req: Request, key: string, fallback?: string): string {
  const val = req.query[key]
  if (typeof val === 'string') return val
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0]
  return fallback ?? ''
}

/** Safely read a route param as string */
export function param(req: Request, key: string): string {
  const val = req.params[key]
  return typeof val === 'string' ? val : ''
}
