import React from 'react';
import { Shield, Trash2, Key, HardDrive, Lock, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function PrivacyBlueprint() {
  return (
    <section id="privacy-section" className="py-16 border-t border-border">
      <div className="container space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5" /> Strict Privacy Model
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Zero-Storage Architecture by Design
          </h2>
          <p className="text-sm text-muted-foreground">
            Unlike generic converters that store your uploaded documents on cloud disks, OptiPress operates strictly on ephemeral session principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-card/60">
            <CardHeader>
              <div className="p-2.5 w-fit rounded-lg bg-primary/10 text-primary mb-2">
                <Trash2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Automatic Session Eviction</CardTitle>
              <CardDescription className="text-xs">
                All uploaded files, compressed artifacts, and transient processing memory are automatically destroyed as soon as your download completes or your session refreshes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card/60">
            <CardHeader>
              <div className="p-2.5 w-fit rounded-lg bg-accent/10 text-accent mb-2">
                <Lock className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">In-Flight Encryption</CardTitle>
              <CardDescription className="text-xs">
                All data streams between your browser and our isolated optimization workers are protected by TLS 1.3 encryption. No intermediate third-party access.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card/60">
            <CardHeader>
              <div className="p-2.5 w-fit rounded-lg bg-primary/10 text-primary mb-2">
                <HardDrive className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Metadata Sanitization</CardTitle>
              <CardDescription className="text-xs">
                Sensitive document metadata, EXIF camera tags, author profiles, and geolocation identifiers are stripped automatically during compression.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}
