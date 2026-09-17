'use client';

import React, { useState } from 'react';
import { Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClearWorkspaceButtonProps {
  onClearWorkspace: () => Promise<boolean>;
  isClearing?: boolean;
}

export function ClearWorkspaceButton({ onClearWorkspace, isClearing = false }: ClearWorkspaceButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = async () => {
    setShowConfirm(false);
    await onClearWorkspace();
  };

  if (showConfirm) {
    return (
      <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-2 text-destructive font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Clear all workspace files & history?</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClear}
            disabled={isClearing}
            className="h-7 text-xs font-semibold px-3"
          >
            {isClearing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes, Clear'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowConfirm(false)}
            disabled={isClearing}
            className="h-7 text-xs px-2.5"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowConfirm(true)}
      disabled={isClearing}
      className="text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border gap-1.5"
    >
      {isClearing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      <span>Clear Workspace</span>
    </Button>
  );
}
