'use client';

import React from 'react';
import { ModernUploadZone } from '@/components/file-workflow/upload-zone';

export interface UploadZoneProps {
  sessionId?: string;
  onFileSelect?: (file: File) => void;
  onOptimizationComplete?: () => void;
  disabled?: boolean;
  acceptTypes?: string;
  allowedExtensions?: string[];
  customErrorMessage?: string;
  title?: string;
  description?: string;
  supportedBadges?: string[];
  initialTabMode?: 'strategy' | 'target';
  lockTabMode?: boolean;
}

export function UploadZone(props: UploadZoneProps) {
  return <ModernUploadZone {...props} />;
}
