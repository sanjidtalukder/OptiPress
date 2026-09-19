import React from 'react';
import type { Metadata } from 'next';
import { PdfCompressionView } from '@/components/tools/pdf-compression-view';

export const metadata: Metadata = {
  title: 'Compress PDF Online | OptiPress',
  description: 'Compress PDF documents online while preserving page structure, vector graphics, and text sharpness with Zero-Storage privacy.',
};

export default function CompressPdfPage() {
  return <PdfCompressionView />;
}
