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
}

export const pdfOptimizerService = new PdfOptimizerService();
