// Local sentence embeddings — zero API keys, runs entirely inside the API container.
// Uses Xenova/all-MiniLM-L6-v2 (384 dimensions, ~25MB ONNX model loaded into memory at boot).
// First call takes ~3-5s to load the model; subsequent calls are ~50-100ms.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractorPromise: Promise<any> | null = null

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import('@xenova/transformers')
      console.log('[Embeddings] Loading Xenova/all-MiniLM-L6-v2 (first call ~3-5s)…')
      const t0 = Date.now()
      const ext = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      console.log(`[Embeddings] Model loaded in ${Date.now() - t0}ms`)
      return ext
    })()
  }
  return extractorPromise
}

export async function embed(text: string): Promise<number[]> {
  const extractor = await getExtractor()
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}
