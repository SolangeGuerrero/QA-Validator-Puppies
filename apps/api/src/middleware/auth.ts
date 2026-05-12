import { Request, Response, NextFunction } from 'express'
import { insforgeAdmin } from '../lib/insforge.js'
import { prisma } from '../lib/prisma.js'

export type Role = 'admin' | 'manager' | 'reviewer' | 'viewer'

declare global {
  namespace Express {
    interface Request {
      userId?: string
      userEmail?: string
      userRole?: Role
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const { data: { user }, error } = await insforgeAdmin.auth.getUser(token)
    if (error || !user) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
    req.userId = user.id
    req.userEmail = user.email
    next()
  } catch {
    res.status(401).json({ error: 'Token verification failed' })
  }
}

// Role-based gate. Must run AFTER requireAuth. Denies with 403 if user's role is not in the
// allowed list. Looks the role up in our `users` table (Supabase auth metadata is not the
// source of truth — we update DB role on invite/edit).
export function requireRole(...allowed: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } })
    const role = (user?.role as Role | undefined) ?? 'viewer'
    req.userRole = role
    if (!allowed.includes(role)) {
      res.status(403).json({ error: `Role '${role}' is not allowed to perform this action` })
      return
    }
    next()
  }
}
