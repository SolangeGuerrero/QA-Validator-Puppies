import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/handler.js'
import { retrieve } from '../services/rag.js'

const router = Router()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const CHAT_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001'

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string
    history?: { role: 'user' | 'assistant'; content: string }[]
  }

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' })
    return
  }

  const chunks = await retrieve(message, 10)
  const sources = chunks.map(c => ({
    brand:    c.brand,
    category: c.category,
    severity: c.severity,
    date:     c.created_at,
  }))

  const contextBlock = chunks.length > 0
    ? `HISTORIAL DE VALIDACIONES RELEVANTES:\n${chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n')}`
    : 'No hay validaciones previas registradas todavía.'

  const systemPrompt = `Sos un asistente experto en QA de packaging de Puppies Argentina.
Respondés preguntas sobre el historial de validaciones de arte creativo.
Basás tus respuestas ÚNICAMENTE en el historial de validaciones que se te provee.
Si no encontrás información relevante en el historial, decís claramente que no tenés datos suficientes.
Respondés en español, de forma concisa y accionable.
No inventás datos ni errores que no estén en el historial.`

  const userMessage = `${contextBlock}\n\nPREGUNTA DEL USUARIO:\n${message}`

  const response = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 1024,
    temperature: 0.2,
    system: systemPrompt,
    messages: [
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: userMessage },
    ],
  })

  const firstText = response.content.find(b => b.type === 'text')
  const answer = firstText && firstText.type === 'text' ? firstText.text : ''

  res.json({ answer, sources })
}, 'Chat failed'))

export default router
