import { createClient } from '@supabase/supabase-js'

const url = process.env.INSFORGE_URL
const serviceKey = process.env.INSFORGE_SERVICE_KEY

if (!url || !serviceKey) {
  console.warn('[InsForge] Missing INSFORGE_URL or INSFORGE_SERVICE_KEY — auth/storage disabled')
}

// Admin client (service role — server-side only)
export const insforgeAdmin = createClient(
  url ?? '',
  serviceKey ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function uploadFileToStorage(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const { error } = await insforgeAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = insforgeAdmin.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function getFileBuffer(fileUrl: string): Promise<Buffer> {
  const res = await fetch(fileUrl)
  if (!res.ok) throw new Error(`Failed to fetch file: ${fileUrl}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
