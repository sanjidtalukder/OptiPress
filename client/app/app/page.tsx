import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Shield, RefreshCw, Lock, Sparkles, HardDrive, User, KeyRound, Cpu } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/auth/components/logout-button';
import { UploadZone } from '@/features/upload/components/upload-zone';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Workspace Dashboard',
  description: 'Protected OptiPress optimization workspace.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppWorkspacePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/app');
  }

  // Retrieve user profile data from public.profiles table
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle();

  // Generate or retrieve current OptiPress application session metadata
  const appSessionId = `app_sess_${user.id.substring(0, 8)}_${Date.now().toString(36)}`;
  const sessionCreatedAt = new Date().toISOString();
  const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return (
    <div className="container py-8 space-y-8">
      {/* Workspace Header Banner */}
      <div className="rounded-2xl border border-border bg-card/80 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="gap-1 text-[10px] uppercase font-mono">
              <Shield className="h-3 w-3" /> Authenticated Workspace
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              Session Active
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            OptiPress Target-Size Workspace
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            Signed in as <strong className="text-foreground font-semibold">{user.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LogoutButton variant="default" className="font-semibold shadow-sm" />
        </div>
      </div>

      {/* Main Workspace Workspace Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload & Optimizer Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Target-Size Compression Tool
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select your PDF or image to initialize ephemeral processing.
                </p>
              </div>
            </div>

            <UploadZone />
          </div>
        </div>

        {/* Right Column: Session & Identity Diagnostics */}
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
                <Badge variant="accent" className="text-[10px] capitalize">{profile?.plan || 'free'} Tier</Badge>
              </div>
            </CardContent>
          </Card>

          {/* OptiPress Application Session Metadata Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-accent" />
                  OptiPress App Session
                </CardTitle>
                <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
              </div>
              <CardDescription className="text-xs">
                Application-level workspace state bound to authenticated user.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Session ID</span>
                <span className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  {appSessionId}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Created At</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {new Date(sessionCreatedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Expires In</span>
                <span className="font-mono text-[11px] text-success">24 Hours</span>
              </div>
            </CardContent>
          </Card>

          {/* Session Persistence Guarantee Card */}
          <Card className="border-border bg-muted/30">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <RefreshCw className="h-4 w-4 text-primary" />
                <span>Session Persistence</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Refreshing your browser will <strong>NOT</strong> log you out. Your Supabase authentication cookies remain active.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-accent font-medium pt-1 border-t border-border/50">
                <Lock className="h-3.5 w-3.5" />
                <span>Zero Permanent File Retention</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
