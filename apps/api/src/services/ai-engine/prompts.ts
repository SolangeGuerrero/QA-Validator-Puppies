export interface ProductContext {
  name: string
  sku: string
  brand: string
  category: string
}

export function buildValidationPrompt(
  product: ProductContext,
  documentTexts: string[],
  ragContext: string[] = [],
) {
  const hasDocuments = documentTexts.length > 0
  const docsSection = hasDocuments
    ? documentTexts.map((d, i) => `--- Document ${i + 1} ---\n${d.slice(0, 6000)}`).join('\n\n')
    : null

  const systemPrompt = hasDocuments
    ? `You are an expert packaging compliance auditor for Puppies Argentina with deep knowledge of SENASA regulations and Argentine food labelling law.
Your ONLY job is to compare the artwork image word-by-word against the reference documents and report every single discrepancy you find.
You MUST respond with valid JSON only — no markdown, no code blocks, no commentary outside the JSON.

CRITICAL RULES:
- You are NOT allowed to approve something you cannot fully read. If text is too small or unclear, flag it as a warning.
- You MUST check EVERY piece of text in the image: product name, ingredient list, nutritional table, legal statements, claims, codes, weights, registration numbers, certifications, footnotes, and fine print.
- A discrepancy is ANY difference between what the artwork shows and what the documents require — including spelling, capitalization, italics, abbreviations, word order, punctuation, and numeric values.
- Do NOT ignore "minor" differences. A single wrong word or missing italic is a compliance issue.
- If the documents require something that is completely absent from the artwork, report it as a critical issue.
- Report each discrepancy as a SEPARATE issue. Do not group multiple problems into one issue.`
    : `You are a packaging compliance auditor for Puppies.
No reference documents were provided for this product.
You MUST respond with valid JSON only — no markdown, no extra text, no code blocks.
Since no brand guidelines or legal documents are attached, return a complianceScore of null and explain in the summary that validation requires reference documents to be attached to this product.
Return an empty issues array and empty passedChecks array.`

  const userPrompt = hasDocuments
    ? `Perform an exhaustive compliance review of this packaging artwork.

PRODUCT: ${product.name} (SKU: ${product.sku}, Brand: ${product.brand}, Category: ${product.category})

REFERENCE DOCUMENTS:
${docsSection}
${ragContext.length > 0 ? `
HISTORIAL DE ERRORES DETECTADOS EN VALIDACIONES ANTERIORES (productos similares):
Estos errores fueron encontrados en validaciones pasadas de productos de la misma marca o categoría.
Prestalés atención especial — es muy probable que se repitan.
────────────────────────────────────────────────
${ragContext.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')}
────────────────────────────────────────────────
` : ''}

REVIEW CHECKLIST — check each item systematically:

1. INGREDIENT LIST
   - Read every ingredient name letter by letter. Any word that differs from the document is an issue.
   - Check the order of ingredients (must be in decreasing order by weight as required by documents).
   - Check that required italic formatting is applied (e.g., allergens in Argentina must be highlighted).
   - Verify exact terminology: "color" vs "colorante", "proteína bruta" vs "proteína cruda", etc.

2. NUTRITIONAL TABLE
   - Verify every value (calories, protein, fat, carbohydrates, moisture, ash, etc.) matches the document exactly.
   - Check units (%, g, kcal) and their placement.
   - Verify the serving size / base (100g, 100ml, per serving) matches what the document specifies.

3. MANDATORY CODES & REGISTRATION NUMBERS
   - SENASA registration number: present and exact?
   - EAN / barcode number: present?
   - Material number (SAP code): present and correct?
   - ZPCK / FERT codes: present if required by document?
   - Any other codes listed in the document.

4. MANDATORY CLAIMS & LEGAL STATEMENTS
   - Check every legal statement word by word.
   - Verify manufacturer name, address, and country are present and correct.
   - Check net weight declaration: value, unit, and placement.
   - Verify "Consumir antes de:" / expiry date format if specified.
   - Check storage instructions match document requirements.

5. BRAND & PRODUCT NAME
   - Product name spelling matches document exactly.
   - Variant / flavor descriptor matches.
   - Life stage claim (puppy, adult, senior) matches.

6. FORMATTING REQUIREMENTS
   - Italics: is everything that should be italic actually italic?
   - Capitalization: ALL CAPS where required?
   - Font size compliance: any text that appears smaller than legally required?

7. MISSING REQUIRED ELEMENTS
   - List every element the document requires that is completely absent from the artwork.

For EACH issue found, report it individually with the EXACT text found in the artwork and the EXACT text required by the document.

Respond ONLY with this JSON structure:
{
  "complianceScore": <integer 0-100, where 100 = zero issues found>,
  "summary": "<2-3 sentence assessment: total issues found, most critical problems, overall risk level>",
  "issues": [
    {
      "title": "<issue title, max 8 words>",
      "description": "Found: \"<exact text in artwork>\" — Required: \"<exact text from document>\"",
      "severity": "<critical|warning|info>",
      "category": "<ingredient|nutrition|codes|legal|brand|formatting|missing>",
      "suggestion": "<exact correction: what to change, add, or remove>"
    }
  ],
  "passedChecks": [
    "<specific element verified correct, e.g.: 'SENASA Nº XXXXXX present and correct'>"
  ]
}

Severity:
- critical: Regulatory non-compliance, wrong mandatory text, missing required code, incorrect nutritional value
- warning: Wrong terminology, missing italic/caps, minor wording deviation from document
- info: Element present but document is ambiguous about exact wording`
    : `This is a validation request for: ${product.name} (SKU: ${product.sku}, Brand: ${product.brand})

No reference documents are attached to this product.

Respond ONLY with this exact JSON structure:
{
  "complianceScore": null,
  "summary": "No reference documents attached. Please add brand guidelines and legal documents to this product before running a validation.",
  "issues": [],
  "passedChecks": []
}`

  return { system: systemPrompt, user: userPrompt }
}
