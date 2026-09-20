'use client';

import React from 'react';
import { Target, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { UploadZone } from '@/features/upload/components/upload-zone';
import { HistoryPanel } from '@/features/history/components/history-panel';
import { useTemporaryHistory } from '@/features/history/hooks/use-temporary-history';
import { useWorkspaceSession } from '@/features/workspace/hooks/use-workspace-session';
import { PrivacyNoticeBanner } from '@/components/workspace/privacy-notice-banner';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function TargetSizeView() {
  const { appSessionId } = useWorkspaceSession();
  const { history, isLoading: isHistoryLoading, refetchHistory, removeItem, downloadResult } = useTemporaryHistory(appSessionId);

  const targetHistory = history.filter((item) => item.operation.toLowerCase().includes('target'));

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      {/* Tool Header */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="gap-1.5 text-[10px] uppercase font-mono px-2.5 py-0.5">
              <Target className="h-3.5 w-3.5" /> Target Size Engine
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              Binary Size Precision
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Target Size Optimization
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            Specify your exact target file size (e.g. 100 KB or 1 MB). Our binary search engine compresses your image to fit while protecting visual clarity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 shrink-0">
          <Shield className="h-4 w-4" />
          <span>Honest Target Guarantee</span>
        </div>
      </div>

      <PrivacyNoticeBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Dedicated Target Size Upload Zone */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Target Size Workspace
                </h2>
                <p className="text-xs text-muted-foreground">
                  Upload a PDF or image and choose your target size.
                </p>
              </div>
            </div>

            <UploadZone
              sessionId={appSessionId}
              acceptTypes=".pdf,.jpg,.jpeg,.png,.webp"
              allowedExtensions={['pdf', 'jpg', 'jpeg', 'png', 'webp']}
              customErrorMessage={undefined}
              title="Upload file for Target Size optimization"
              description="Drop a PDF or image here to reduce it to your chosen file size."
              supportedBadges={['PDF', 'JPG', 'PNG', 'WEBP']}
              initialTabMode="target"
              lockTabMode={true}
              onFileSelect={() => setTimeout(refetchHistory, 1000)}
              onOptimizationComplete={() => setTimeout(refetchHistory, 250)}
            />
          </div>

          {/* Target Size History */}
          <HistoryPanel
            history={targetHistory.length > 0 ? targetHistory : history}
            isLoading={isHistoryLoading}
            onDownload={downloadResult}
            onRemove={removeItem}
          />
        </div>

        {/* Right Column: How Target Size Works */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Target Size Engine Rules
              </CardTitle>
              <CardDescription className="text-xs">
                How OptiPress achieves exact size limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="space-y-1 py-1 border-b border-border/50">
                <strong className="text-foreground text-xs font-semibold block">1. Binary Search Iteration</strong>
                <p className="text-[11px] leading-relaxed">
                  Iteratively adjusts compression parameters to reach your chosen KB target without trial and error.
                </p>
              </div>
              <div className="space-y-1 py-1 border-b border-border/50">
                <strong className="text-foreground text-xs font-semibold block">2. Quality Threshold Protection</strong>
                <p className="text-[11px] leading-relaxed">
                  If reducing to your target size would severely degrade visual quality, OptiPress reports the best safe size achieved.
                </p>
              </div>
              <div className="space-y-1 py-1">
                <strong className="text-foreground text-xs font-semibold block">3. Try Anyway (Force Target)</strong>
                <p className="text-[11px] leading-relaxed">
                  Enable Force Target if you must guarantee compliance even at lower visual quality scores.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
