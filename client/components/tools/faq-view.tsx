'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqView() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'What file types does OptiPress support?',
      answer: 'OptiPress supports PDF documents (.pdf) and major image formats including JPG/JPEG (.jpg, .jpeg), PNG (.png), and WebP (.webp).',
    },
    {
      question: 'How does PDF compression work?',
      answer: 'PDF compression cleans up duplicate embedded font descriptors, eliminates uncompressed structural object bloat, and optimizes embedded images while preserving exact page counts and vector sharpness.',
    },
    {
      question: 'How does image compression work?',
      answer: 'Image compression removes unnecessary EXIF metadata, applies chroma subsampling, and uses perceptual SSIM quality metrics to reduce bytes without noticeable visual degradation.',
    },
    {
      question: 'Can I reduce an image to exactly 100 KB?',
      answer: 'Yes! Using our dedicated Target Size tool, you can select presets like 99 KB, 100 KB, or 500 KB, or type a custom target. Our binary search engine compresses the image to fit your target size.',
    },
    {
      question: 'What happens if my target size cannot be reached?',
      answer: 'If reducing to your selected size would severely affect visual quality, OptiPress honestly reports "Target size couldn\'t be reached safely" and displays the best safe size achieved. You can also enable Force Target to override quality checks.',
    },
    {
      question: 'Will my image quality be reduced?',
      answer: 'OptiPress uses automatic quality validation checks (SSIM and PSNR gates) to ensure visual clarity is preserved. In Smart mode, visual degradation is imperceptible to the human eye.',
    },
    {
      question: 'Are my uploaded files stored permanently?',
      answer: 'No. OptiPress is privacy-first. Your files are temporary and bound to your active session. They are automatically purged by automated cleanup schedulers.',
    },
    {
      question: 'Does downloading delete my file?',
      answer: 'No. Downloading saves a copy of the optimized result to your device while keeping the result available in your browser workspace for re-download or comparison.',
    },
    {
      question: 'What is Target Size optimization?',
      answer: 'Target Size optimization is a specialized engine that takes a specific binary file size constraint (e.g., 200 KB) and iteratively calculates compression parameters to match your limit.',
    },
    {
      question: 'What is the maximum upload size?',
      answer: 'The current maximum file size limit for uploads is 100 MB per file across both PDF and image tools.',
    },
    {
      question: 'Why can\'t every file reach 99 KB?',
      answer: 'Extremely complex high-resolution images or dense multi-page PDFs contain structural data that requires a minimum number of bytes to remain readable. Over-compressing would turn the image into solid noise.',
    },
    {
      question: 'Can I compress the same file multiple times?',
      answer: 'Yes! You can re-optimize files using different modes (Smart, Quality, Maximum, or Target Size) or upload a new version using the Replace File action.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container py-12 space-y-10 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="accent" className="gap-1.5 text-xs font-mono uppercase px-3 py-1">
          <HelpCircle className="h-3.5 w-3.5" /> Help & Support
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Find honest answers to common questions about PDF compression, image optimization, target file sizes, and privacy guarantees.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <Card
              key={faq.question}
              className={`border transition-all ${
                isOpen ? 'border-primary/50 bg-card shadow-sm' : 'border-border/80 bg-card/60 hover:border-border'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-2xl"
              >
                <span className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2.5">
                  <Sparkles className={`h-4 w-4 shrink-0 transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <CardContent className="px-5 pb-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 mt-1 pt-3 animate-fade-in">
                  {faq.answer}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
