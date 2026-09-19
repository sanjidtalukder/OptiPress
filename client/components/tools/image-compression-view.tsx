'use client';

import React from 'react';
import { Image as ImageIcon, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { UploadZone } from '@/features/upload/components/upload-zone';
import { HistoryPanel } from '@/features/history/components/history-panel';
import { useTemporaryHistory } from '@/features/history/hooks/use-temporary-history';
import { useWorkspaceSession } from '@/features/workspace/hooks/use-workspace-session';
import { PrivacyNoticeBanner } from '@/components/workspace/privacy-notice-banner';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function ImageCompressionView() {
  const { appSessionId } = useWorkspaceSession();
  const { history, isLoading: isHistoryLoading, refetchHistory, removeItem, downloadResult } = useTemporaryHistory(appSessionId);

  const imageHistory = history.filter((item) => ['jpg', 'jpeg', 'png', 'webp'].includes(item.extension.toLowerCase()));

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      {/* Tool Header */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="gap-1.5 text-[10px] uppercase font-mono px-2.5 py-0.5">
              <ImageIcon className="h-3.5 w-3.5" /> Dedicated Image Tool
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              Smart / Quality / Maximum
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Compress Images (JPG, PNG, WebP)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            Reduce image file sizes with visual quality protection. Choose your compression level for optimal web & email sharing.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 shrink-0">
          <Shield className="h-4 w-4" />
          <span>Visual Quality Protection</span>
        </div>
      </div>

      <PrivacyNoticeBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Dedicated Image Upload Zone */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Image Optimization Workspace
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select a JPG, PNG, or WEBP image to reduce file size.
                </p>
              </div>
            </div>

            <UploadZone
              sessionId={appSessionId}
              acceptTypes=".jpg,.jpeg,.png,.webp"
              allowedExtensions={['jpg', 'jpeg', 'png', 'webp']}
              customErrorMessage="Compress Images accepts JPG, PNG, or WEBP files."
              title="Upload your image file"
              description="Drop a JPG, PNG, or WEBP image here, or browse from your computer."
              supportedBadges={['JPG', 'PNG', 'WEBP']}
              initialTabMode="strategy"
              lockTabMode={true}
              onFileSelect={() => setTimeout(refetchHistory, 1000)}
              onOptimizationComplete={() => setTimeout(refetchHistory, 250)}
            />
          </div>

          {/* Image History */}
          <HistoryPanel
            history={imageHistory}
            isLoading={isHistoryLoading}
            onDownload={downloadResult}
            onRemove={removeItem}
          />
        </div>

        {/* Right Column: Image Modes Explanation */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Optimization Modes
              </CardTitle>
              <CardDescription className="text-xs">
                Available image compression modes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="space-y-1 py-1 border-b border-border/50">
                <strong className="text-foreground text-xs font-semibold block">SMART (Recommended)</strong>
                <p className="text-[11px] leading-relaxed">
                  Best balance of quality and file size. Uses perceptual metrics to achieve maximum reduction without noticeable artifacts.
                </p>
              </div>
              <div className="space-y-1 py-1 border-b border-border/50">
                <strong className="text-foreground text-xs font-semibold block">QUALITY</strong>
                <p className="text-[11px] leading-relaxed">
                  Keep more visual detail while reducing file size. Ideal for photography & high-resolution artwork.
                </p>
              </div>
              <div className="space-y-1 py-1">
                <strong className="text-foreground text-xs font-semibold block">MAXIMUM</strong>
                <p className="text-[11px] leading-relaxed">
                  Reduces file size as much as possible for extreme web performance & fast attachments.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
