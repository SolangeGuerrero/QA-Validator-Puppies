import type { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Wrap an async route handler so any thrown error becomes a logged 500 response.
 * Eliminates the repeated `try { ... } catch { res.status(500).json(...) }` boilerplate.
 *
 * For handlers that need custom error mapping (e.g. Prisma P2002 → 409),
 * keep using an explicit try/catch — this wrapper is only for the default 500.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
  errorMessage = 'Internal server error',
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(`[${req.method} ${req.originalUrl}]`, err)
      if (!res.headersSent) {
        res.status(500).json({ error: errorMessage })
      }
    })
  }
}
