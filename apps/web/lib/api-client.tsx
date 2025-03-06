import { Prisma, Device } from "@repo/database";

type ApiResponse<T> = {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
};

type RequestConfig = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = 'http://localhost:5000/api') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: config.method,
        headers: {
          ...this.defaultHeaders,
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        credentials: 'include', // Include credentials for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: {
            message: errorData.error || 'An unexpected error occurred',
            code: response.status.toString(),
          },
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  // Device endpoints
  async createDevice(data: Prisma.DeviceCreateWithoutUserInput) {
    return this.request<Device>('/devices', {
      method: 'POST',
      body: data,
    });
  }

  async getDevices() {
    return this.request<Device[]>('/devices', {
      method: 'GET',
    });
  }

  async getDevice(id: string) {
    return this.request<Device>(`/devices/${id}`, {
      method: 'GET',
    });
  }

  async updateDevice(id: string, data: Prisma.DeviceUpdateInput) {
    return this.request<Device>(`/devices/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteDevice(id: string) {
    return this.request<void>(`/devices/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient("http://localhost:5000/api");