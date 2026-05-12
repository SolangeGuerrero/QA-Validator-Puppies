import { GoogleGenerativeAI } from '@google/generative-ai'
import { ValidationOutputSchema } from './validation-output-schema.js'
import { buildValidationPrompt, type ProductContext } from './prompts.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export async function validateCreativeWithGemini(
  imageBase64: string,
  imageMediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf',
  product: ProductContext,
  documentTexts: string[],
  ragContext: string[] = [],
) {
  const prompt = buildValidationPrompt(product, documentTexts, ragContext)

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: prompt.system,
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0,
      topK: 1,
    },
  })

  const response = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: imageMediaType,
      },
    },
    prompt.user,
  ])

  const raw = response.response.text()
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(cleaned)
  return ValidationOutputSchema.parse(parsed)
}
