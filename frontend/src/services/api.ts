const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401 && this.refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          this.setTokens(data.accessToken, data.refreshToken);
          headers['Authorization'] = `Bearer ${data.accessToken}`;

          const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
          if (!retryRes.ok) {
            const error = await retryRes.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${retryRes.status}`);
          }
          return retryRes.json();
        }
      } catch {
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  async login(email: string, password: string) {
    const data = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async getMe() {
    return this.request<any>('/api/auth/me');
  }

  async getDashboardStats() {
    return this.request<any>('/api/dashboard');
  }

  async getWebsites() {
    return this.request<any[]>('/api/websites');
  }

  async getWebsite(id: string) {
    return this.request<any>(`/api/websites/${id}`);
  }

  async createWebsite(data: any) {
    return this.request<any>('/api/websites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWebsite(id: string, data: any) {
    return this.request<any>(`/api/websites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateWebsiteStatus(id: string, status: string, reason?: string) {
    return this.request<any>(`/api/websites/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async getWebsiteFinancial(id: string) {
    return this.request<any>(`/api/websites/${id}/financial`);
  }

  async getWebsiteMaintenance(id: string) {
    return this.request<any[]>(`/api/websites/${id}/maintenance`);
  }

  async createMaintenance(websiteId: string, data: any) {
    return this.request<any>(`/api/websites/${websiteId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWebsiteTimeline(id: string) {
    return this.request<any[]>(`/api/websites/${id}/timeline`);
  }

  async getWebsiteCharges(id: string) {
    return this.request<any[]>(`/api/websites/${id}/charges`);
  }

  async addCharge(websiteId: string, data: any) {
    return this.request<any>(`/api/websites/${websiteId}/charges`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addTimelineEvent(websiteId: string, data: any) {
    return this.request<any>(`/api/websites/${websiteId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<any>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async createWebsiteNotification(websiteId: string, data: any) {
    return this.request<any>(`/api/websites/${websiteId}/notifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWebsiteHosting(id: string, data: any) {
    return this.request<any>(`/api/websites/${id}/hosting`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateWebsiteDatabase(id: string, data: any) {
    return this.request<any>(`/api/websites/${id}/database`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateWebsiteServer(id: string, data: any) {
    return this.request<any>(`/api/websites/${id}/server`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateWebsitePlan(id: string, data: any) {
    return this.request<any>(`/api/websites/${id}/plan`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCustomers() {
    return this.request<any[]>('/api/customers');
  }

  async getCustomer(id: string) {
    return this.request<any>(`/api/customers/${id}`);
  }

  async createCustomer(data: any) {
    return this.request<any>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: any) {
    return this.request<any>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleCustomerActive(id: string) {
    return this.request<any>(`/api/customers/${id}/toggle-active`, {
      method: 'PATCH',
    });
  }

  async resetCustomerPassword(id: string, password: string) {
    return this.request<any>(`/api/customers/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async getTechnicians() {
    return this.request<any[]>('/api/technicians');
  }

  async getTechnician(id: string) {
    return this.request<any>(`/api/technicians/${id}`);
  }

  async createTechnician(data: any) {
    return this.request<any>('/api/technicians', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleTechnicianActive(id: string) {
    return this.request<any>(`/api/technicians/${id}/toggle-active`, {
      method: 'PATCH',
    });
  }

  async assignTechnicianWebsite(technicianId: string, websiteId: string) {
    return this.request<any>(`/api/technicians/${technicianId}/assign-website`, {
      method: 'POST',
      body: JSON.stringify({ websiteId }),
    });
  }

  async removeTechnicianAssignment(technicianId: string, websiteId: string) {
    return this.request<any>(`/api/technicians/${technicianId}/assign-website/${websiteId}`, {
      method: 'DELETE',
    });
  }

  async setTechnicianPermission(technicianId: string, websiteId: string, permission: string) {
    return this.request<any>(`/api/technicians/${technicianId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ websiteId, permission }),
    });
  }

  async removeTechnicianPermission(technicianId: string, websiteId: string, permission: string) {
    return this.request<any>(`/api/technicians/${technicianId}/permissions/${websiteId}/${permission}`, {
      method: 'DELETE',
    });
  }

  async getNotifications() {
    return this.request<any[]>('/api/notifications');
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/api/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request<any>('/api/notifications/read-all', {
      method: 'POST',
    });
  }

  async createNotification(data: any) {
    return this.request<any>('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getActivityLogs() {
    return this.request<any[]>('/api/admin/activity');
  }

  async getUpcomingCharges() {
    return this.request<any[]>('/api/billing/upcoming');
  }

  async getDueDates() {
    return this.request<any>('/api/billing/due-dates');
  }
}

export const api = new ApiClient();
