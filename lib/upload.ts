import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL

// Allowed MIME types for uploads
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
])

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf',
])

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `File type '${file.type}' is not allowed. Allowed: images (JPEG, PNG, GIF, WebP, SVG) and PDF` }
  }

  // Check file extension
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File extension '${ext}' is not allowed` }
  }

  return { valid: true }
}

export async function saveFile(
  file: File,
  folder: string,
  filename: string
): Promise<string> {
  // Validate file before processing
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Sanitize folder and filename to prevent path traversal
  const safeFolder = folder.replace(/\.\./g, '').replace(/[^a-zA-Z0-9-_/]/g, '')
  const safeFilename = filename.replace(/\.\./g, '').replace(/[^a-zA-Z0-9-_.]/g, '')

  const buffer = Buffer.from(await file.arrayBuffer())
  
  if (isProduction) {
    // Use Vercel Blob in production
    const blob = await put(`${safeFolder}/${safeFilename}`, buffer, {
      access: 'public',
    })
    return blob.url
  } else {
    // Use local file system in development
    const uploadDir = join(process.cwd(), 'uploads', safeFolder)
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    const filePath = join(uploadDir, safeFilename)
    await writeFile(filePath, buffer)
    
    return `/uploads/${safeFolder}/${safeFilename}`
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
