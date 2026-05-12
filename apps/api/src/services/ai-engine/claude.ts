import Anthropic from '@anthropic-ai/sdk'
import { ValidationOutputSchema } from './validation-output-schema.js'
import { buildValidationPrompt, type ProductContext } from './prompts.js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function validateCreativeWithClaude(
  imageBase64: string,
  imageMediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
  product: ProductContext,
  documentTexts: string[],
  ragContext: string[] = [],
) {
  const prompt = buildValidationPrompt(product, documentTexts, ragContext)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: prompt.system,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageMediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt.user,
          },
        ],
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip any accidental markdown code blocks
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  const parsed = JSON.parse(cleaned)
  return ValidationOutputSchema.parse(parsed)
}
