import { Router } from 'express'
import { insforgeAdmin } from '../lib/insforge.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const adminOnly = requireRole('admin')
import { asyncHandler } from '../lib/handler.js'
import { param } from '../lib/query.js'

const router = Router()

// GET /auth/me — returns current user profile (auto-creates on first access)
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  let user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) {
    const { data: { user: authUser } } = await insforgeAdmin.auth.getUser(
      req.headers.authorization!.replace('Bearer ', ''),
    )
    user = await prisma.user.create({
      data: {
        id: authUser!.id,
        email: authUser!.email!,
        name: authUser!.user_metadata?.name ?? authUser!.email!.split('@')[0],
        role: authUser!.user_metadata?.role ?? 'viewer',
      },
    })
  }
  res.json(user)
}, 'Failed to fetch user'))

// GET /auth/users — list all users
router.get('/users', requireAuth, asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
  res.json(users)
}, 'Failed to fetch users'))

// POST /auth/invites — admin-only: send Supabase invite + pre-create DB record
router.post('/invites', requireAuth, adminOnly, asyncHandler(async (req, res) => {
  const { email, role = 'viewer', name } = req.body as {
    email?: string
    role?: string
    name?: string
  }
  if (!email) { res.status(400).json({ error: 'Email required' }); return }

  const displayName = name?.trim() || email.split('@')[0]
  const redirectTo = `${process.env.WEB_URL ?? 'http://localhost:5176'}/auth/callback`

  const { data, error } = await insforgeAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name: displayName, role },
    redirectTo,
  })
  if (error || !data.user) {
    res.status(400).json({ error: error?.message ?? 'Failed to send invite' })
    return
  }

  await prisma.user.upsert({
    where: { id: data.user.id },
    create: { id: data.user.id, email, name: displayName, role },
    update: { role, name: displayName },
  })

  res.status(201).json({ ok: true, userId: data.user.id, email, role })
}, 'Failed to send invite'))

// DELETE /auth/users/:id — admin-only: remove user from Supabase auth + DB
router.delete('/users/:id', requireAuth, adminOnly, asyncHandler(async (req, res) => {
  const targetId = param(req, 'id')
  if (targetId === req.userId) {
    res.status(400).json({ error: 'You cannot delete yourself' })
    return
  }

  const { error: authErr } = await insforgeAdmin.auth.admin.deleteUser(targetId)
  if (authErr && !authErr.message?.toLowerCase().includes('not found')) {
    res.status(400).json({ error: authErr.message })
    return
  }
  await prisma.user.delete({ where: { id: targetId } }).catch(() => {})
  res.status(204).send()
}, 'Failed to delete user'))

export default router
