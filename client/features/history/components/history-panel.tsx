'use client';

import React from 'react';
import { History, Download, Trash2, ArrowDownRight, FileText, Image as ImageIcon, Sparkles, Clock, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SessionHistoryItem } from '@optipress/types';

interface HistoryPanelProps {
  history: SessionHistoryItem[];
  isLoading?: boolean;
  onDownload?: (item: SessionHistoryItem) => void;
  onRemove?: (id: string) => void;
}

export function HistoryPanel({ history, isLoading = false, onDownload, onRemove }: HistoryPanelProps) {
  if (history.length === 0 && !isLoading) {
    return (
      <Card className="border-border bg-card/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Your files
          </CardTitle>
          <CardDescription className="text-xs">
            Files are temporary and automatically removed for your privacy.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mx-auto text-muted-foreground">
            <History className="h-6 w-6" />
          </div>
          <p className="text-xs font-medium text-foreground">No optimized files yet</p>
          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
            Your recently optimized files will appear here during your session.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Your files ({history.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Files are temporary and automatically removed for your privacy.
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <Shield className="h-3.5 w-3.5 text-accent" />
          <span>Privacy protected</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {history.map((item) => {
          const isPdf = item.extension.toLowerCase() === 'pdf';
          const formatTimeAgo = (dateStr: string) => {
            try {
              const diffMs = Date.now() - new Date(dateStr).getTime();
              const mins = Math.floor(diffMs / 60000);
              if (mins < 1) return 'Just now';
              if (mins < 60) return `${mins} min ago`;
              const hours = Math.floor(mins / 60);
              return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            } catch {
              return 'Recently';
            }
          };

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-border bg-card/80 hover:border-accent/40 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20 mt-0.5">
                    {isPdf ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate max-w-[180px] sm:max-w-xs">
                        {item.originalName}
                      </span>
                      <Badge variant="outline" className="uppercase text-[9px] font-mono">
                        {item.extension}
                      </Badge>
                      <Badge
                        variant={item.status === 'completed' ? 'accent' : 'outline'}
                        className={`text-[9px] capitalize gap-1 ${
                          item.status === 'completed' ? '' : 'text-destructive border-destructive/30 bg-destructive/10'
                        }`}
                      >
                        {item.status === 'completed' ? (
                          <>
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Completed
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Failed
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap font-mono">
                      <span>
                        {formatBytes(item.originalSize)} → <strong className="text-foreground">{formatBytes(item.outputSize)}</strong>
                      </span>

                      {item.reductionPercentage > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-accent font-semibold text-[11px]">
                          <ArrowDownRight className="h-3 w-3" />
                          Size Reduced {item.reductionPercentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.status === 'completed' && onDownload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(item)}
                      className="h-8 px-2.5 text-xs font-semibold gap-1.5 shadow-xs"
                      title="Download file"
                    >
                      <Download className="h-3.5 w-3.5 text-primary" />
                      <span>Download</span>
                    </Button>
                  )}

                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(item.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      title="Remove file"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Item Metadata Footer */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-accent" />
                  {item.operation}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(item.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

