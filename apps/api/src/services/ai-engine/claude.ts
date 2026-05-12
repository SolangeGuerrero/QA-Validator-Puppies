import Anthropic from '@anthropic-ai/sdk'
import { ValidationOutputSchema } from './validation-output-schema.js'
import { buildValidationPrompt, type ProductContext } from './prompts.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// claude-3-5-haiku is fast + vision-capable + ~5x cheaper than Sonnet.
// Sonnet is more accurate for complex labels — swap via env var if needed.
const VISION_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001'

export async function validateCreativeWithClaude(
  imageBase64: string,
  imageMediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf',
  product: ProductContext,
  documentTexts: string[],
  ragContext: string[] = [],
) {
  const prompt = buildValidationPrompt(product, documentTexts, ragContext)

  // Anthropic vision doesn't accept PDFs in messages.create — only image types.
  // The worker should rasterize PDFs to PNG before reaching here.
  if (imageMediaType === 'application/pdf') {
    throw new Error('Claude vision requires raster images; rasterize PDFs to PNG first.')
  }

  const response = await client.messages.create({
    model: VISION_MODEL,
    max_tokens: 4096,
    temperature: 0,
    system: prompt.system,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: imageMediaType, data: imageBase64 },
          },
          { type: 'text', text: prompt.user },
        ],
      },
    ],
  })

  const firstText = response.content.find(b => b.type === 'text')
  const raw = firstText && firstText.type === 'text' ? firstText.text : ''
  if (!raw) throw new Error('Claude returned empty content')

  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(cleaned)
  return ValidationOutputSchema.parse(parsed)
}
