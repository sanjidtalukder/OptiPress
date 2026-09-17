import { PdfOptimizationMode, PdfOptimizationResult, ApiResponse } from '@optipress/types';

export class PdfOptimizerService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async optimizePdf(
    fileId: string,
    mode: PdfOptimizationMode,
    accessToken: string
  ): Promise<{ success: boolean; data?: PdfOptimizationResult; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdfs/${fileId}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ mode }),
      });

      const body: ApiResponse<PdfOptimizationResult> = await response.json();

      if (!response.ok || !body.success) {
        return {
          success: false,
          error: body.error?.message || 'PDF optimization failed.',
        };
      }

      return {
        success: true,
        data: body.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error during PDF optimization.',
      };
    }
  }

  async downloadOptimizedPdf(
    outputFileId: string,
    accessToken: string,
    fallbackFileName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/files/${outputFileId}/download?type=result`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        let message = 'Optimized PDF download failed.';
        try {
          const body: ApiResponse = await response.json();
          message = body.error?.message || message;
        } catch {
          // Binary responses do not have JSON error bodies.
        }
        return { success: false, error: message };
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fallbackFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error during optimized PDF download.',
      };
    }
  }
}

export const pdfOptimizerService = new PdfOptimizerService();
