'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does Target-Size Compression work?',
      a: 'Instead of applying a generic percentage slider, OptiPress analyzes image structures, PDF vector streams, and font tables. It iteratively adjusts quantization and downsampling parameters to hit your exact target KB requirement.',
    },
    {
      q: 'Is my document or image kept on your servers?',
      a: 'Never. OptiPress uses an ephemeral zero-storage architecture. Files are processed in isolated temporary memory sandboxes and deleted immediately after download or session refresh.',
    },
    {
      q: 'What is the minimum target file size I can specify?',
      a: 'Target sizes start at 99 KB to meet strict email attachment and online portal submission rules. You can also specify custom sizes up to 100 MB.',
    },
    {
      q: 'What file formats are supported?',
      a: 'Currently, OptiPress supports PDF documents, as well as JPG, JPEG, PNG, WEBP, and AVIF image formats.',
    },
  ];

  return (
    <section id="faq-section" className="py-16 border-t border-border">
      <div className="container max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Everything You Need to Know</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-border bg-card overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed animate-fade-in border-t border-border/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
