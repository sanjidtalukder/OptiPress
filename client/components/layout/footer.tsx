import React from 'react';
import Link from 'next/link';
import { Layers, ShieldCheck, Cpu, Heart } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-sm text-muted-foreground text-xs py-12 transition-colors">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Summary */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm text-foreground">{siteConfig.name}</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Precision PDF and image target-size optimizer. Engineered with zero-retention privacy principles.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-accent font-mono pt-1">
            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-ping" />
            <span>API Engine v1.0 • Ephemeral Memory Active</span>
          </div>
        </div>

        {/* Tools Column */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Optimization Tools</h4>
          <ul className="space-y-1.5">
            <li><a href="#upload-section" className="hover:text-foreground transition-colors">Target Size PDF Compressor</a></li>
            <li><a href="#upload-section" className="hover:text-foreground transition-colors">JPG/PNG Optimizer</a></li>
            <li><a href="#upload-section" className="hover:text-foreground transition-colors">PNG to WEBP Converter</a></li>
            <li><a href="#upload-section" className="hover:text-foreground transition-colors">AVIF & Modern Format Scaling</a></li>
          </ul>
        </div>

        {/* Architecture & Security Column */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Architecture & Privacy</h4>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Zero-Storage Ephemeral Sessions</li>
            <li className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-primary" /> Isolated Processing Sandboxes</li>
            <li><a href="#privacy-section" className="hover:text-foreground transition-colors">Privacy Architecture Blueprint</a></li>
            <li><a href="#faq-section" className="hover:text-foreground transition-colors">Security FAQ</a></li>
          </ul>
        </div>

        {/* Legal & System */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">System Status</h4>
          <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span>System Health</span>
              <span className="font-semibold text-success">100% Operational</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>Storage Eviction</span>
              <span className="font-mono text-muted-foreground">Every Session</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            © {new Date().getFullYear()} {siteConfig.name}. Designed for high performance.
          </p>
        </div>
      </div>
    </footer>
  );
}
