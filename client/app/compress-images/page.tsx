import React from 'react';
import type { Metadata } from 'next';
import { ImageCompressionView } from '@/components/tools/image-compression-view';

export const metadata: Metadata = {
  title: 'Compress Images Online | OptiPress',
  description: 'Compress JPG, PNG, and WebP images with perceptual visual quality protection and custom compression modes.',
};

export default function CompressImagesPage() {
  return <ImageCompressionView />;
}
