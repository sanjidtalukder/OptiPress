import { AppSessionData, ApiResponse } from '@optipress/types';

export class SessionService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async getAppSession(accessToken: string): Promise<AppSessionData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return null;

      const body: ApiResponse<{ session: AppSessionData }> = await response.json();
      return body.data?.session || null;
    } catch {
      return null;
    }
  }

  async createAppSession(accessToken: string): Promise<AppSessionData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return null;

      const body: ApiResponse<{ session: AppSessionData }> = await response.json();
      return body.data?.session || null;
    } catch {
      return null;
    }
  }

  async deleteAppSession(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/session`, {
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

export const sessionService = new SessionService();
