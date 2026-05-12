import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRouter from './routes/auth.js'
import productsRouter from './routes/products.js'
import assetsRouter from './routes/assets.js'
import validationsRouter from './routes/validations.js'
import dashboardRouter from './routes/dashboard.js'
import agentsRouter from './routes/agents.js'
import { prisma } from './lib/prisma.js'
import { setupRagSchema } from './services/rag.js'
import chatRouter from './routes/chat.js'

// Prevent stray worker-thread errors from killing the process
process.on('uncaughtException', (err) => {
  console.error('[Process] uncaughtException — keeping server alive:', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('[Process] unhandledRejection — keeping server alive:', reason)
})

const app = express()
const PORT = process.env.PORT ?? 3001

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.WEB_URL
    : /^http:\/\/localhost:\d+$/,
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() })
})

// Routes
app.use('/auth', authRouter)
app.use('/products', productsRouter)
app.use('/creative-assets', assetsRouter)
app.use('/validations', validationsRouter)
app.use('/dashboard', dashboardRouter)
app.use('/agents', agentsRouter)
app.use('/chat', chatRouter)

// Set up pgvector schema (idempotent)
setupRagSchema().catch(err => console.error('[RAG] Schema setup failed:', err))

// Reset any validations that were left in 'running' state by a previous crash
prisma.validation.updateMany({
  where: { status: 'running' },
  data: { status: 'failed', completedAt: new Date() },
}).then(r => {
  if (r.count > 0) console.log(`[Startup] Reset ${r.count} stuck running validation(s) to failed`)
}).catch(() => {})

app.listen(PORT, () => {
  console.log(`[API] Server running at http://localhost:${PORT}`)
})

export default app
