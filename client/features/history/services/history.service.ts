import { SessionHistoryItem, ApiResponse } from '@optipress/types';

export class HistoryService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async getHistory(accessToken: string, sessionId?: string): Promise<SessionHistoryItem[]> {
    try {
      const url = new URL(`${this.baseUrl}/api/history`);
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

      const body: ApiResponse<{ history: SessionHistoryItem[] }> = await response.json();
      return body.data?.history || [];
    } catch {
      return [];
    }
  }

  async deleteHistoryItem(id: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/history/${id}`, {
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

  async downloadResultFile(fileId: string, accessToken: string, fallbackFileName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/files/${fileId}/download?type=result`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return false;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fallbackFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    } catch {
      return false;
    }
  }
}

export const historyService = new HistoryService();
