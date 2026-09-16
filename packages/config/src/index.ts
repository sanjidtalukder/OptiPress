import { SupportedFileType } from '@optipress/types';

export const APP_NAME = 'OptiPress';
export const APP_SLOGAN = 'You choose the target size. We protect quality and privacy.';

export const FILE_LIMITS = {
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100 MB max upload
  MIN_TARGET_SIZE_KB: 99, // 99 KB target size minimum
  MAX_BATCH_FILES: 10,
};

export const SUPPORTED_MIME_TYPES: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const SUPPORTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.avif'];

export const TARGET_SIZE_PRESETS = [
  { label: '99 KB', value: 99, unit: 'KB' as const, description: 'Aggressive compression for email & portal limits' },
  { label: '100 KB', value: 100, unit: 'KB' as const, description: 'Standard lightweight document target' },
  { label: '200 KB', value: 200, unit: 'KB' as const, description: 'Balanced web upload target' },
  { label: '250 KB', value: 250, unit: 'KB' as const, description: 'Medium resolution compressed image' },
  { label: '500 KB', value: 500, unit: 'KB' as const, description: 'High quality web presentation image' },
  { label: '1 MB', value: 1, unit: 'MB' as const, description: 'Large high resolution graphics target' },
  { label: '2 MB', value: 2, unit: 'MB' as const, description: 'Print-ready or detailed artwork target' },
  { label: '5 MB', value: 5, unit: 'MB' as const, description: 'Ultra high definition photo target' },
];

export const TARGET_SIZE_CONFIG = {
  MIN_QUALITY_PSNR: 30, // dB threshold for acceptable visual quality
  MAX_ITERATIONS: 8, // max search iterations for candidate search
  TOLERANCE_PERCENT: 3, // 3% tolerance window for candidate selection
  MIN_TARGET_BYTES: 10 * 1024, // 10 KB min
  MAX_TARGET_BYTES: 50 * 1024 * 1024, // 50 MB max
};

export function parseTargetToBytes(size: number, unit: 'KB' | 'MB'): number {
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('Target size must be a finite positive number');
  }
  const multiplier = unit === 'MB' ? 1024 * 1024 : 1024;
  return Math.round(size * multiplier);
}

export function formatBytesBinary(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  const formatted = val % 1 === 0 ? val.toString() : val.toFixed(1);
  return `${formatted} ${units[i]}`;
}

