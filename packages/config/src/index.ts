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
  { label: '99 KB', value: 99, description: 'Aggressive optimization for email & form limits' },
  { label: '200 KB', value: 200, description: 'Standard compressed document target' },
  { label: '500 KB', value: 500, description: 'Balanced high quality compression' },
  { label: '1 MB', value: 1000, description: 'Minimal loss high resolution target' },
];
