import {
  ImageOptimizationMode,
  ImageOptimizationResult,
  TargetSizeOptimizationRequest,
  TargetSizeOptimizationResult,
  ApiResponse,
} from '@optipress/types';

export class ImageOptimizerService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async optimizeImage(
    fileId: string,
    mode: ImageOptimizationMode,
    accessToken: string
  ): Promise<{ success: boolean; data?: ImageOptimizationResult; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/images/${fileId}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ mode }),
      });

      const body: ApiResponse<ImageOptimizationResult> = await response.json();

      if (!response.ok || !body.success) {
        return {
          success: false,
          error: body.error?.message || 'Image optimization failed.',
        };
      }

      return {
        success: true,
        data: body.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error during image optimization.',
      };
    }
  }

  async optimizeTargetSize(
    fileId: string,
    params: TargetSizeOptimizationRequest,
    accessToken: string
  ): Promise<{ success: boolean; data?: TargetSizeOptimizationResult; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/images/${fileId}/target-size`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(params),
      });

      const body: ApiResponse<TargetSizeOptimizationResult> = await response.json();

      if (!response.ok || !body.success) {
        return {
          success: false,
          error: body.error?.message || 'Target size optimization failed.',
        };
      }

      return {
        success: true,
        data: body.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error during target size optimization.',
      };
    }
  }
}

export const imageOptimizerService = new ImageOptimizerService();

