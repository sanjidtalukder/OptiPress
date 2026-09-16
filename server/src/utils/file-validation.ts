import fs from 'fs';

export type AllowedExtension = 'pdf' | 'jpg' | 'jpeg' | 'png' | 'webp';

export interface FileValidationResult {
  isValid: boolean;
  detectedExtension?: AllowedExtension;
  mimeType?: string;
  error?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set<AllowedExtension>([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
]);

/**
 * Validates a file by inspecting magic bytes, mime type, and extension.
 */
export async function validateFileBytes(
  filePath: string,
  originalFilename: string,
  declaredMimeType: string
): Promise<FileValidationResult> {
  const extension = originalFilename.split('.').pop()?.toLowerCase() as AllowedExtension;

  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    return {
      isValid: false,
      error: `Unsupported file extension .${extension || 'unknown'}. Allowed extensions: pdf, jpg, jpeg, png, webp.`,
    };
  }

  if (!ALLOWED_MIME_TYPES.has(declaredMimeType.toLowerCase())) {
    return {
      isValid: false,
      error: `Unsupported MIME type ${declaredMimeType}.`,
    };
  }

  // Read header bytes (first 16 bytes)
  let buffer: Buffer;
  try {
    const handle = await fs.promises.open(filePath, 'r');
    buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, 16, 0);
    await handle.close();
  } catch (err) {
    return {
      isValid: false,
      error: 'Failed to read file signature for validation.',
    };
  }

  // Check Magic Bytes
  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d; // %PDF-

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46; // RIFF
  const isWebp =
    isRiff &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50; // WEBP

  if (extension === 'pdf' && !isPdf) {
    return { isValid: false, error: 'File magic bytes do not match a valid PDF document.' };
  }

  if ((extension === 'jpg' || extension === 'jpeg') && !isJpeg) {
    return { isValid: false, error: 'File magic bytes do not match a valid JPEG image.' };
  }

  if (extension === 'png' && !isPng) {
    return { isValid: false, error: 'File magic bytes do not match a valid PNG image.' };
  }

  if (extension === 'webp' && !isWebp) {
    return { isValid: false, error: 'File magic bytes do not match a valid WebP image.' };
  }

  const detectedExt: AllowedExtension = isPdf
    ? 'pdf'
    : isJpeg
    ? extension === 'jpeg'
      ? 'jpeg'
      : 'jpg'
    : isPng
    ? 'png'
    : isWebp
    ? 'webp'
    : extension;

  const mimeTypeMap: Record<AllowedExtension, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };

  return {
    isValid: true,
    detectedExtension: detectedExt,
    mimeType: mimeTypeMap[detectedExt],
  };
}
