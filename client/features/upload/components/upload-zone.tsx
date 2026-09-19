'use client';

import React from 'react';
import { ModernUploadZone } from '@/components/file-workflow/upload-zone';

interface UploadZoneProps {
  sessionId?: string;
  onFileSelect?: (file: File) => void;
  onOptimizationComplete?: () => void;
  disabled?: boolean;
}

export function UploadZone(props: UploadZoneProps) {
  return <ModernUploadZone {...props} />;
}

