import { SessionFileMetadata, ApiResponse } from '@optipress/types';

export class FileService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async uploadFile(
    file: File,
    accessToken: string,
    sessionId?: string
  ): Promise<{ success: boolean; data?: SessionFileMetadata; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      const response = await fetch(`${this.baseUrl}/api/files/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const body: ApiResponse<SessionFileMetadata> = await response.json();

      if (!response.ok || !body.success) {
        return {
          success: false,
          error: body.error?.message || 'Upload failed. Please try again.',
        };
      }

      return {
        success: true,
        data: body.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error during file upload.',
      };
    }
  }

  async getFiles(accessToken: string, sessionId?: string): Promise<SessionFileMetadata[]> {
    try {
      const url = new URL(`${this.baseUrl}/api/files`);
      if (sessionId) {
        url.searchParams.append('sessionId', sessionId);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return [];

      const body: ApiResponse<{ files: SessionFileMetadata[] }> = await response.json();
      return body.data?.files || [];
    } catch {
      return [];
    }
  }

  async deleteFile(id: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/files/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const fileService = new FileService();
