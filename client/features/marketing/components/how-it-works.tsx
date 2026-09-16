import React from 'react';
import { Upload, Sliders, Download, CheckCircle2 } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: Upload,
      title: 'Select PDF or Image',
      description: 'Drag and drop your file into the secure dropzone. Validation happens locally before upload initialization.',
    },
    {
      step: '02',
      icon: Sliders,
      title: 'Define Target File Size',
      description: 'Pick a preset (e.g. 99 KB, 200 KB) or use the custom target slider to set your exact size limit.',
    },
    {
      step: '03',
      icon: Download,
      title: 'Optimized Download & Auto-Purge',
      description: 'Our adaptive engine optimizes vectors, downsamples images, and purges all server traces upon download.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 bg-muted/30 border-t border-border">
      <div className="container space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">How Target-Size Optimization Works</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            3-step precision workflow designed for document submission requirements, portals, and web publishing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-extrabold text-muted-foreground/30 font-mono">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
