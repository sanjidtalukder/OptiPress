import React from 'react';
import type { Metadata } from 'next';
import { TargetSizeView } from '@/components/tools/target-size-view';

export const metadata: Metadata = {
  title: 'Reduce File to Target Size | OptiPress',
  description: 'Specify an exact target file size in KB or MB (e.g. 100 KB). Our engine compresses your file to fit while protecting visual clarity.',
};

export default function TargetSizePage() {
  return <TargetSizeView />;
}
