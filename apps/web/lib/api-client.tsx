import {
  Prisma,
  Device,
  Repository,
  FirmwareBuilds,
  Group,
} from "@repo/database";

type DeviceWithRepository = Device & {
  repository: Repository | null;
};

type GroupWithRelations = Group & {
  devices: Device[];
  repository: Repository | null;
};

type ApiResponse<T> = {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
};

type RequestConfig = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(
    baseUrl: string = `${(process.env.NEXT_PUBLIC_API_URL as string) ?? "https://api.sector-iot.space"}/api`
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      "Content-Type": "application/json",
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
        credentials: "include", // Include credentials for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: {
            message: errorData.error || "An unexpected error occurred",
            code: response.status.toString(),
          },
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Network error",
          code: "NETWORK_ERROR",
        },
      };
    }
  }

  // Device endpoints
  async createDevice(data: Prisma.DeviceCreateWithoutUserInput) {
    return this.request<Device>("/devices", {
      method: "POST",
      body: data,
    });
  }

  async getDevices() {
    return this.request<DeviceWithRepository[]>("/devices", {
      method: "GET",
    });
  }

  async getDevice(id: string) {
    return this.request<DeviceWithRepository>(`/devices/${id}`, {
      method: "GET",
    });
  }

  async updateDevice(id: string, data: Prisma.DeviceUpdateInput) {
    return this.request<Device>(`/devices/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteDevice(id: string) {
    return this.request<void>(`/devices/${id}`, {
      method: "DELETE",
    });
  }

  // Repository endpoints
  async createRepository(data: Prisma.RepositoryCreateWithoutUserInput) {
    return this.request<Repository>("/repositories", {
      method: "POST",
      body: data,
    });
  }

  async getRepositories() {
    return this.request<Repository[]>("/repositories", {
      method: "GET",
    });
  }

  async getRepository(id: string) {
    return this.request<Repository>(`/repositories/${id}`, {
      method: "GET",
    });
  }

  async updateRepository(id: string, data: Prisma.RepositoryUpdateInput) {
    return this.request<Repository>(`/repositories/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteRepository(id: string) {
    return this.request<void>(`/repositories/${id}`, {
      method: "DELETE",
    });
  }

  async linkDeviceToRepository(deviceId: string, repositoryId: string) {
    return this.request<Device>("/repositories/link-device", {
      method: "POST",
      body: { deviceId, repositoryId },
    });
  }

  async unlinkDeviceFromRepository(deviceId: string) {
    return this.request<Device>(`/repositories/unlink-device/${deviceId}`, {
      method: "DELETE",
    });
  }

  // Firmware Build endpoints
  async createFirmwareBuild(data: {
    version: number;
    url?: string;
    repositoryId: string;
  }) {
    return this.request<FirmwareBuilds>("/firmware", {
      method: "POST",
      body: data,
    });
  }

  async getFirmwareBuilds() {
    return this.request<FirmwareBuilds[]>("/firmware", {
      method: "GET",
    });
  }

  async getFirmwareBuild(id: string) {
    return this.request<FirmwareBuilds>(`/firmware/${id}`, {
      method: "GET",
    });
  }

  async updateFirmwareBuild(
    id: string,
    data: {
      version?: number;
      url?: string;
      status?: "BUILDING" | "SUCCESS" | "FAILED";
    }
  ) {
    return this.request<FirmwareBuilds>(`/firmware/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteFirmwareBuild(id: string) {
    return this.request<void>(`/firmware/${id}`, {
      method: "DELETE",
    });
  }

  // Group endpoints
  async createGroup(data: { name: string; description?: string }) {
    return this.request<Group>("/groups", {
      method: "POST",
      body: data,
    });
  }

  async getGroups() {
    return this.request<GroupWithRelations[]>("/groups", {
      method: "GET",
    });
  }

  async getGroup(id: string) {
    return this.request<GroupWithRelations>(`/groups/${id}`, {
      method: "GET",
    });
  }

  async updateGroup(id: string, data: { name?: string; description?: string }) {
    return this.request<Group>(`/groups/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteGroup(id: string) {
    return this.request<void>(`/groups/${id}`, {
      method: "DELETE",
    });
  }

  async addDeviceToGroup(groupId: string, deviceId: string) {
    return this.request<void>(`/groups/${groupId}/devices/${deviceId}`, {
      method: "POST",
    });
  }

  async removeDeviceFromGroup(groupId: string, deviceId: string) {
    return this.request<void>(`/groups/${groupId}/devices/${deviceId}`, {
      method: "DELETE",
    });
  }

  async linkRepositoryToGroup(groupId: string, repositoryId: string) {
    return this.request<void>(
      `/groups/${groupId}/repositories/${repositoryId}`,
      {
        method: "POST",
      }
    );
  }

  async unlinkRepositoryFromGroup(groupId: string, repositoryId: string) {
    return this.request<void>(
      `/groups/${groupId}/repositories/${repositoryId}`,
      {
        method: "DELETE",
      }
    );
  }

  async getFirmwareForDevice(deviceId: string) {
    return this.request(`/firmware/device/${deviceId}`, {
      method: "GET",
    });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();
