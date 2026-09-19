'use client';

import React from 'react';
import { ImagePreview } from './image-preview';
import { PdfPreview } from './pdf-preview';

interface FilePreviewProps {
  src?: string | File | null;
  fileName: string;
  fileSize: number;
  extension: string;
  dimensions?: { width: number; height: number } | null;
  pageCount?: number;
  label?: string;
  className?: string;
}

export function FilePreview({
  src,
  fileName,
  fileSize,
  extension,
  dimensions,
  pageCount,
  label,
  className = '',
}: FilePreviewProps) {
  const isPdf = extension.toLowerCase() === 'pdf';

  if (isPdf) {
    return (
      <PdfPreview
        src={src}
        fileName={fileName}
        fileSize={fileSize}
        pageCount={pageCount}
        label={label}
        className={className}
      />
    );
  }

  return (
    <ImagePreview
      src={src}
      fileName={fileName}
      fileSize={fileSize}
      extension={extension}
      dimensions={dimensions}
      label={label}
      className={className}
    />
  );
}
