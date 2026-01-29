import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL

export async function saveFile(
  file: File,
  folder: string,
  filename: string
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  
  if (isProduction) {
    // Use Vercel Blob in production
    const blob = await put(`${folder}/${filename}`, buffer, {
      access: 'public',
    })
    return blob.url
  } else {
    // Use local file system in development
    const uploadDir = join(process.cwd(), 'uploads', folder)
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, buffer)
    
    return `/uploads/${folder}/${filename}`
  }
}

export function getFileUrl(path: string): string {
  // If it's already a full URL (from Vercel Blob), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // Otherwise, it's a local path
  return path
}
