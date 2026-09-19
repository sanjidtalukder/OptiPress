'use client';

import React from 'react';
import { FileText, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { UploadZone } from '@/features/upload/components/upload-zone';
import { HistoryPanel } from '@/features/history/components/history-panel';
import { useTemporaryHistory } from '@/features/history/hooks/use-temporary-history';
import { useWorkspaceSession } from '@/features/workspace/hooks/use-workspace-session';
import { PrivacyNoticeBanner } from '@/components/workspace/privacy-notice-banner';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function PdfCompressionView() {
  const { appSessionId } = useWorkspaceSession();
  const { history, isLoading: isHistoryLoading, refetchHistory, removeItem, downloadResult } = useTemporaryHistory(appSessionId);

  const pdfHistory = history.filter((item) => item.extension.toLowerCase() === 'pdf');

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      {/* Tool Header */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="gap-1.5 text-[10px] uppercase font-mono px-2.5 py-0.5">
              <FileText className="h-3.5 w-3.5" /> Dedicated PDF Tool
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              Vector & Text Preserved
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Compress PDF Document
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            Reduce PDF file sizes while protecting visual structure, vector graphics, and embedded font legibility.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 shrink-0">
          <Shield className="h-4 w-4" />
          <span>Zero-Storage PDF Security</span>
        </div>
      </div>

      <PrivacyNoticeBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Dedicated PDF Upload Zone */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  PDF Optimization Workspace
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select a PDF file to reduce storage overhead.
                </p>
              </div>
            </div>

            <UploadZone
              sessionId={appSessionId}
              acceptTypes=".pdf"
              allowedExtensions={['pdf']}
              customErrorMessage="Compress PDF accepts PDF files only."
              title="Upload your PDF file"
              description="Drop a PDF document here, or browse from your computer."
              supportedBadges={['PDF']}
              initialTabMode="strategy"
              lockTabMode={true}
              onFileSelect={() => setTimeout(refetchHistory, 1000)}
              onOptimizationComplete={() => setTimeout(refetchHistory, 250)}
            />
          </div>

          {/* PDF History */}
          <HistoryPanel
            history={pdfHistory}
            isLoading={isHistoryLoading}
            onDownload={downloadResult}
            onRemove={removeItem}
          />
        </div>

        {/* Right Column: PDF Info Cards */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                PDF Optimization Standards
              </CardTitle>
              <CardDescription className="text-xs">
                How OptiPress optimizes your PDF documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="space-y-1 py-1 border-b border-border/50">
                <strong className="text-foreground text-xs font-semibold block">1. Object Stream Streamlining</strong>
                <p className="text-[11px] leading-relaxed">
                  Removes duplicate font metadata, uncompressed structural streams, and redundant metadata tags.
                </p>
              </div>
              <div className="space-y-1 py-1 border-b border-border/50">
                <strong className="text-foreground text-xs font-semibold block">2. Image Downsampling & Quality Gate</strong>
                <p className="text-[11px] leading-relaxed">
                  Re-compresses embedded raster graphics using visual quality checks to ensure text remains crisp.
                </p>
              </div>
              <div className="space-y-1 py-1">
                <strong className="text-foreground text-xs font-semibold block">3. Page Count Integrity</strong>
                <p className="text-[11px] leading-relaxed">
                  Guarantees 100% exact page count preservation without page loss or layout degradation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
