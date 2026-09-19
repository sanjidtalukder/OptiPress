import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes?: number | null, decimals = 2): string {
  if (
    bytes === undefined ||
    bytes === null ||
    isNaN(Number(bytes)) ||
    !isFinite(Number(bytes)) ||
    Number(bytes) < 0
  ) {
    return 'Not available';
  }

  const numBytes = Number(bytes);
  if (numBytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  if (i < 0 || i >= sizes.length || isNaN(i) || !isFinite(i)) {
    return 'Not available';
  }

  const formatted = parseFloat((numBytes / Math.pow(k, i)).toFixed(dm));
  return `${formatted} ${sizes[i]}`;
}

export function formatKB(kb?: number | null): string {
  if (kb === undefined || kb === null || isNaN(Number(kb)) || !isFinite(Number(kb)) || Number(kb) < 0) {
    return 'Not available';
  }
  const val = Number(kb);
  if (val >= 1000) {
    return `${parseFloat((val / 1000).toFixed(2))} MB`;
  }
  return `${parseFloat(val.toFixed(2))} KB`;
}

