import React from 'react';
import type { Metadata } from 'next';
import { FaqView } from '@/components/tools/faq-view';

export const metadata: Metadata = {
  title: 'OptiPress FAQ | Frequently Asked Questions',
  description: 'Find honest answers to questions about PDF compression, image optimization, target file sizes, quality checks, and Zero-Storage privacy.',
};

export default function FaqPage() {
  return <FaqView />;
}
