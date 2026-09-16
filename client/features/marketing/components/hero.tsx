import React from 'react';
import { ShieldCheck, ArrowRight, Zap, Target, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  return (
    <section className="relative pt-12 pb-8 md:pt-20 md:pb-14 text-center space-y-6 max-w-4xl mx-auto px-4">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary shadow-sm">
        <Target className="h-3.5 w-3.5 text-accent" />
        <span>Target-Size Optimization • Ephemeral Privacy Architecture</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
        You choose the target size.{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
          We protect visual quality.
        </span>
      </h1>

      {/* Supporting Copy */}
      <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        OptiPress intelligently compresses PDFs and images to your required file size limit—starting at{' '}
        <strong className="text-foreground font-semibold">99 KB</strong>. Zero permanent file storage, zero quality compromise.
      </p>

      {/* Feature Micro-Badges */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="h-4 w-4 text-accent" /> No Permanent Server Storage
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <Zap className="h-4 w-4 text-primary" /> Target-Size Guarantee
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <Lock className="h-4 w-4 text-accent" /> TLS Encrypted Processing
        </span>
      </div>
    </section>
  );
}
