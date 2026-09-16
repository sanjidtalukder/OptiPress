import React from 'react';
import { Hero } from '@/features/marketing/components/hero';
import { UploadZone } from '@/features/upload/components/upload-zone';
import { TargetSizeDemo } from '@/features/optimizer/components/target-size-demo';
import { PrivacyBlueprint } from '@/features/marketing/components/privacy-blueprint';
import { HowItWorks } from '@/features/marketing/components/how-it-works';
import { FaqSection } from '@/features/marketing/components/faq-section';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <Hero />

      {/* Upload Zone (Primary CTA) */}
      <section id="upload-section" className="container px-4">
        <UploadZone />
      </section>

      {/* Target Size Concept & Interactive Demonstration */}
      <section className="container px-4">
        <TargetSizeDemo />
      </section>

      {/* Privacy Architecture Guarantee */}
      <PrivacyBlueprint />

      {/* 3-Step Workflow */}
      <HowItWorks />

      {/* FAQ Preview */}
      <FaqSection />
    </div>
  );
}
