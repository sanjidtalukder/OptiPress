import React from 'react';
import type { Metadata } from 'next';
import { HowItWorksView } from '@/components/tools/how-it-works-view';

export const metadata: Metadata = {
  title: 'How OptiPress Works | Privacy-First Compression',
  description: 'Learn how OptiPress compresses PDFs and images, guarantees target file sizes, and protects your privacy with automatic session cleanup.',
};

export default function HowItWorksPage() {
  return <HowItWorksView />;
}
