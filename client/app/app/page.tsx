import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceView } from '@/components/workspace/workspace-view';

export const metadata: Metadata = {
  title: 'Workspace Dashboard',
  description: 'Protected OptiPress ephemeral optimization workspace.',
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

  return (
    <WorkspaceView
      user={{ id: user.id, email: user.email || '' }}
      userPlan={profile?.plan || 'free'}
    />
  );
}
