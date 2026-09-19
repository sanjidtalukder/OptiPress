'use client';

import React from 'react';
import { Shield, Sparkles, User, KeyRound, Cpu, RefreshCw } from 'lucide-react';
import { LogoutButton } from '@/auth/components/logout-button';
import { UploadZone } from '@/features/upload/components/upload-zone';
import { HistoryPanel } from '@/features/history/components/history-panel';
import { useTemporaryHistory } from '@/features/history/hooks/use-temporary-history';
import { useWorkspaceSession } from '@/features/workspace/hooks/use-workspace-session';
import { PrivacyNoticeBanner } from '@/components/workspace/privacy-notice-banner';
import { ClearWorkspaceButton } from '@/components/workspace/clear-workspace-button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WorkspaceViewProps {
  user: {
    id: string;
    email: string;
  };
  userPlan: string;
}

export function WorkspaceView({ user, userPlan }: WorkspaceViewProps) {
  const { appSessionId, isClearing, clearWorkspace } = useWorkspaceSession();
  const { history, isLoading: isHistoryLoading, refetchHistory, removeItem, downloadResult, clearLocalHistoryState } = useTemporaryHistory(appSessionId);

  const handleClearWorkspaceAction = async (): Promise<boolean> => {
    const success = await clearWorkspace();
    if (success) {
      clearLocalHistoryState();
    }
    return success;
  };

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      {/* Workspace Header Banner */}
      <div className="rounded-2xl border border-border bg-card/80 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="gap-1 text-[10px] uppercase font-mono">
              <Shield className="h-3 w-3" /> Secure Workspace
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              Active
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            OptiPress File Optimization Workspace
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            Signed in as <strong className="text-foreground font-semibold">{user.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ClearWorkspaceButton onClearWorkspace={handleClearWorkspaceAction} isClearing={isClearing} />
          <LogoutButton variant="default" className="font-semibold shadow-sm" />
        </div>
      </div>

      {/* Privacy Disclosure Notice */}
      <PrivacyNoticeBanner />

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload Zone & History Panel */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Optimize PDF & Images
                </h2>
                <p className="text-xs text-muted-foreground">
                  Upload your file to optimize size and visual quality.
                </p>
              </div>
            </div>

            <UploadZone
              sessionId={appSessionId}
              onFileSelect={() => {
                setTimeout(refetchHistory, 1000);
              }}
              onOptimizationComplete={() => {
                setTimeout(refetchHistory, 250);
              }}
            />
          </div>

          {/* Ephemeral History Panel */}
          <HistoryPanel
            history={history}
            isLoading={isHistoryLoading}
            onDownload={downloadResult}
            onRemove={removeItem}
          />
        </div>

        {/* Right Column: Account & Privacy Info */}
        <div className="space-y-6">
          {/* Account Profile Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Account Details
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  Verified
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Your OptiPress account subscription & plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Signed in as</span>
                <span className="font-medium text-foreground truncate max-w-[170px]">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Account Plan</span>
                <Badge variant="accent" className="text-[10px] capitalize">{userPlan} Plan</Badge>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Workspace Status</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Ready
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Cleanup Guarantee Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  Privacy & Data Security
                </CardTitle>
                <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
              </div>
              <CardDescription className="text-xs">
                Your files are temporary and protected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 space-y-1">
                <span className="font-bold text-accent text-xs block">Automatic Cleanup</span>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Your files are temporary and automatically cleaned up for your privacy.
                </p>
              </div>

              <div className="space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span>File Storage</span>
                  <span className="font-medium text-foreground">Encrypted Ephemeral</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>File Cleanup</span>
                  <span className="font-medium text-emerald-400">Automatic</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Guarantee Card */}
          <Card className="border-border bg-muted/30">
            <CardContent className="p-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <RefreshCw className="h-4 w-4 text-primary" />
                <span>Session Guarantee</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Your account session remains securely authenticated. Temporary files in active browser tabs can be cleared anytime using the <strong>Clear Workspace</strong> button above.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
