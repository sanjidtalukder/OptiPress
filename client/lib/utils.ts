import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes?: number | null, decimals = 2): string {
  if (bytes === undefined || bytes === null || isNaN(Number(bytes)) || Number(bytes) < 0) {
    return 'Size unavailable';
  }

  const numBytes = Number(bytes);
  if (numBytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  if (i < 0 || i >= sizes.length || isNaN(i)) {
    return 'Size unavailable';
  }

  return parseFloat((numBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatKB(kb: number): string {
  if (kb >= 1000) {
    return `${(kb / 1000).toFixed(1)} MB`;
  }
  return `${kb} KB`;
}
