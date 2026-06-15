import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const MEDIA_UPLOAD_WEB_PREFIX = '/uploads/media';
export const MEDIA_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'media');
export const MEDIA_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function inferExtension(file: File): string | null {
  const mime = file.type.toLowerCase();

  if (EXTENSION_BY_MIME[mime]) {
    return EXTENSION_BY_MIME[mime];
  }

  const extension = path.extname(file.name).toLowerCase();

  if (ALLOWED_EXTENSIONS.has(extension)) {
    return extension === '.jpeg' ? '.jpg' : extension;
  }

  return null;
}

function hasAllowedImageSignature(buffer: Buffer, mime: string): boolean {
  if (mime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mime === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mime === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  return false;
}

export function isAllowedMediaImageFile(file: File): boolean {
  if (!(file instanceof File) || file.size <= 0 || file.size > MEDIA_UPLOAD_MAX_BYTES) {
    return false;
  }

  return inferExtension(file) !== null;
}

export async function saveMediaImageUpload(file: File): Promise<string> {
  if (!isAllowedMediaImageFile(file)) {
    throw new Error('Ogiltig bildfil. Använd JPG, PNG eller WebP (max 5 MB).');
  }

  const extension = inferExtension(file);

  if (!extension) {
    throw new Error('Ogiltig bildfil. Använd JPG, PNG eller WebP (max 5 MB).');
  }

  const mime = file.type.toLowerCase() || MIME_BY_EXTENSION[extension] || 'image/jpeg';
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!hasAllowedImageSignature(buffer, mime)) {
    throw new Error('Filen verkar inte vara en giltig bild.');
  }

  const date = new Date().toISOString().slice(0, 10);
  const filename = `${date}-${randomUUID()}${extension}`;

  await fs.mkdir(MEDIA_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(MEDIA_UPLOAD_DIR, filename), buffer);

  return `${MEDIA_UPLOAD_WEB_PREFIX}/${filename}`;
}

export async function deleteMediaImageFile(filePath: string | null | undefined): Promise<void> {
  if (!filePath?.startsWith(`${MEDIA_UPLOAD_WEB_PREFIX}/`)) {
    return;
  }

  const absolutePath = path.join(process.cwd(), 'public', filePath);

  try {
    await fs.unlink(absolutePath);
  } catch {
    // Ignore missing files during cleanup.
  }
}
