import React from 'react';
import type { Metadata } from 'next';
import { Layers } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { SignupForm } from '@/auth/components/signup-form';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create an OptiPress account for privacy-first target size optimization.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md mb-2">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Join {siteConfig.name}
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            High performance target-size reduction. Privacy architecture guaranteed.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
