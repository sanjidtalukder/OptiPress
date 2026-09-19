/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Maximize2, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';

interface PdfPreviewProps {
  src?: string | File | null;
  fileName: string;
  fileSize: number;
  pageCount?: number;
  label?: string;
  className?: string;
}

export function PdfPreview({
  src,
  fileName,
  fileSize,
  pageCount: initialPageCount,
  label,
  className = '',
}: PdfPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | undefined>(initialPageCount);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [renderedCanvasUrl, setRenderedCanvasUrl] = useState<string | null>(null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!src) {
      setObjectUrl(null);
      return;
    }

    if (typeof src === 'string') {
      setObjectUrl(src);
      return;
    }

    if (src instanceof File) {
      const url = URL.createObjectURL(src);
      setObjectUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [src]);

  // Dynamically attempt PDF first-page rendering using pdfjs-dist if available or fallback thumbnail
  useEffect(() => {
    if (!objectUrl) return;

    let isMounted = true;
    setIsLoadingThumbnail(true);

    const renderPdfFirstPage = async () => {
      try {
        // Dynamically load pdfjs from cdnjs if not present in window
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
              if ((window as any).pdfjsLib) {
                (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
                  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
              } else {
                reject(new Error('PDF.js failed to load'));
              }
            };
            script.onerror = () => reject(new Error('PDF.js script error'));
            document.head.appendChild(script);
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) return;

        const loadingTask = pdfjsLib.getDocument(objectUrl);
        const pdf = await loadingTask.promise;

        if (isMounted) {
          setPageCount(pdf.numPages);
        }

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.8 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext).promise;

          if (isMounted) {
            setRenderedCanvasUrl(canvas.toDataURL('image/png'));
          }
        }
      } catch (err) {
        // Fall back gracefully to visual PDF thumbnail document representation
      } finally {
        if (isMounted) setIsLoadingThumbnail(false);
      }
    };

    renderPdfFirstPage();

    return () => {
      isMounted = false;
    };
  }, [objectUrl]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Visual Container */}
      <div className="relative group overflow-hidden rounded-2xl border border-border/80 bg-neutral-900/90 p-4 shadow-inner flex flex-col items-center justify-center min-h-[200px] max-h-[340px]">
        {label && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="accent" className="text-[10px] font-semibold px-2 py-0.5 shadow-sm">
              {label}
            </Badge>
          </div>
        )}

        {renderedCanvasUrl ? (
          <div className="relative w-full h-full flex items-center justify-center py-1">
            <img
              src={renderedCanvasUrl}
              alt={`PDF first page of ${fileName}`}
              className="max-h-[260px] w-auto max-w-full object-contain rounded-lg shadow-md border border-neutral-700/60 transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>
        ) : (
          /* Styled PDF First-Page Document Mockup Fallback */
          <div className="w-48 h-60 rounded-xl bg-neutral-800/90 border border-neutral-700 p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
            <div className="flex items-center justify-between border-b border-neutral-700/70 pb-2">
              <div className="flex items-center gap-1.5 text-primary">
                <FileText className="h-4 w-4" />
                <span className="text-[11px] font-bold tracking-tight">PDF Document</span>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 text-neutral-400">
                Page 1
              </Badge>
            </div>

            {/* Document Lines Simulation */}
            <div className="space-y-2 py-2 opacity-60">
              <div className="h-2.5 bg-neutral-600 rounded-full w-3/4" />
              <div className="h-2 bg-neutral-700 rounded-full w-full" />
              <div className="h-2 bg-neutral-700 rounded-full w-5/6" />
              <div className="h-2 bg-neutral-700 rounded-full w-4/5" />
              <div className="h-2 bg-neutral-700 rounded-full w-2/3" />
              <div className="h-2 bg-neutral-700 rounded-full w-full" />
            </div>

            <div className="pt-2 border-t border-neutral-700/50 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span className="truncate max-w-[100px]">{fileName}</span>
              {pageCount ? <span>{pageCount} pgs</span> : null}
            </div>
          </div>
        )}

        {/* Preview Action Button */}
        {objectUrl && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="absolute bottom-3 right-3 opacity-90 group-hover:opacity-100 transition-opacity text-xs gap-1.5 bg-neutral-800/90 backdrop-blur-md text-white border border-neutral-700 shadow-md hover:bg-neutral-700"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span>Preview PDF</span>
          </Button>
        )}
      </div>

      {/* Details Row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">{fileName}</span>
          <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 border-primary/40 text-primary">
            PDF
          </Badge>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground shrink-0">
          PDF Document • {formatBytes(fileSize)}
          {pageCount ? ` • ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}` : ''}
        </div>
      </div>

      {/* Full PDF Preview Lightbox */}
      {isPreviewOpen && objectUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative max-w-5xl h-[90vh] w-full flex flex-col bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white truncate max-w-lg">{fileName}</h4>
                <p className="text-xs text-neutral-400 font-mono">
                  PDF Document • {formatBytes(fileSize)}
                  {pageCount ? ` • ${pageCount} pages` : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 w-full rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800">
              <iframe src={objectUrl} title={fileName} className="w-full h-full border-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
