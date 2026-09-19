'use client';

import React from 'react';
import {
  Upload,
  Sliders,
  Sparkles,
  ShieldCheck,
  Download,
  Lock,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function HowItWorksView() {
  const steps = [
    {
      number: '01',
      title: 'Upload Your File',
      description: 'Select or drop any PDF, JPG, PNG, or WebP file. Your upload stays in an encrypted temporary workspace.',
      icon: Upload,
      accent: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    },
    {
      number: '02',
      title: 'Choose What You Need',
      description: 'Select Smart, Quality, or Maximum compression modes, or enter an exact target size like 100 KB.',
      icon: Sliders,
      accent: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    },
    {
      number: '03',
      title: 'OptiPress Optimizes the File',
      description: 'Our engine downsamples image metadata, eliminates PDF bloat, and applies perceptual compression.',
      icon: Sparkles,
      accent: 'text-accent border-accent/30 bg-accent/10',
    },
    {
      number: '04',
      title: 'Quality & Structure Validation',
      description: 'Automatic quality gates analyze SSIM metrics and PDF page counts to confirm text and visual clarity remain intact.',
      icon: ShieldCheck,
      accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    {
      number: '05',
      title: 'Download Your Optimized File',
      description: 'Download your result immediately. Your file remains available during your active session.',
      icon: Download,
      accent: 'text-primary border-primary/30 bg-primary/10',
    },
  ];

  return (
    <div className="container py-12 space-y-12 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="accent" className="gap-1.5 text-xs font-mono uppercase px-3 py-1">
          <Zap className="h-3.5 w-3.5" /> 5-Step Compression Architecture
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          How OptiPress Works
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Learn how OptiPress compresses PDFs and images, guarantees target file sizes, and protects visual quality.
        </p>
      </div>

      {/* 5-Step Process Cards */}
      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.number} className="border-border bg-card/80 shadow-sm transition-all hover:border-primary/40">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${step.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{step.number}</span>
                      <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Privacy Architecture Guarantee Section */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 p-8 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Privacy-First Zero Storage Guarantee
            </h2>
            <p className="text-xs text-muted-foreground">Your files belong to you alone.</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Your uploaded files are temporary. We process them for your current active session and clean them up automatically. We do not index, sell, or permanently store your files.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Session Bound
            </span>
            <p className="text-[11px] text-muted-foreground">Files exist only during your active tab session.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Automatic Purge
            </span>
            <p className="text-[11px] text-muted-foreground">Background sweepers clear orphan temporary data.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Instant Clear
            </span>
            <p className="text-[11px] text-muted-foreground">Clear Workspace button purges session storage immediately.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
