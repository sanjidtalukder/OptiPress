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

        {/* Right Column: Session & Identity Info */}
        <div className="space-y-6">
          {/* Supabase Auth Identity Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Supabase Auth Identity
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">Verified</Badge>
              </div>
              <CardDescription className="text-xs">
                Authentication identity managed by Supabase SSR.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-[11px] text-foreground font-semibold truncate max-w-[160px]">
                  {user.id}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Account Plan</span>
                <Badge variant="accent" className="text-[10px] capitalize">{userPlan} Tier</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Active Application Session Metadata Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-accent" />
                  OptiPress Workspace Session
                </CardTitle>
                <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
              </div>
              <CardDescription className="text-xs">
                Ephemeral workspace session bound to active tab.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Session ID</span>
                <span className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20 truncate max-w-[170px]">
                  {appSessionId || 'Initializing...'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Session Status</span>
                <span className="font-mono text-[11px] text-success font-medium">Active (Ephemeral)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Refresh Policy</span>
                <span className="font-mono text-[11px] text-accent">Clear Workspace</span>
              </div>
            </CardContent>
          </Card>

          {/* Persistence Guarantee Card */}
          <Card className="border-border bg-muted/30">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <RefreshCw className="h-4 w-4 text-primary" />
                <span>Session Persistence</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Refreshing your browser will <strong>NOT</strong> log you out. Your Supabase authentication session stays active, but temporary workspace files & history are cleared.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
