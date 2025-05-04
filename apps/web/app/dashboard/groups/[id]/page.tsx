"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

interface Group {
  id: string;
  name: string;
  description?: string | null;
  devices: Array<{
    device: {
      id: string;
      name: string;
    };
  }>;
  repositories: Array<{
    repository: {
      id: string;
      name: string;
    };
  }>;
}

interface Device {
  id: string;
  name: string;
}

interface Repository {
  id: string;
  name: string;
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedRepository, setSelectedRepository] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    fetchGroup();
    fetchDevices();
    fetchRepositories();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const { data, error } = await apiClient.getGroup(id as string);
      if (error) throw new Error(error.message);
      setGroup(data || null);
      setEditName(data?.name || "");
      setEditDescription(data?.description || "");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch group",
        variant: "error",
      });
    }
  };

  const fetchDevices = async () => {
    try {
      const { data, error } = await apiClient.getDevices();
      if (error) throw new Error(error.message);
      setDevices(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch devices",
        variant: "error",
      });
    }
  };

  const fetchRepositories = async () => {
    try {
      const { data, error } = await apiClient.getRepositories();
      if (error) throw new Error(error.message);
      setRepositories(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch repositories",
        variant: "error",
      });
    }
  };

  const handleUpdateGroup = async () => {
    try {
      const { error } = await apiClient.updateGroup(id as string, {
        name: editName,
        description: editDescription,
      });
      if (error) throw new Error(error.message);

      toast({
        title: "Success",
        description: "Group updated successfully",
      });

      setIsEditing(false);
      fetchGroup();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "error",
      });
    }
  };

  const handleAddDevice = async () => {
    if (!selectedDevice) return;

    try {
      const { error } = await apiClient.addDeviceToGroup(
        id as string,
        selectedDevice
      );
      if (error) throw new Error(error.message);

      toast({
        title: "Success",
        description: "Device added to group",
      });

      setSelectedDevice("");
      fetchGroup();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add device",
        variant: "error",
      });
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      const { error } = await apiClient.removeDeviceFromGroup(
        id as string,
        deviceId
      );
      if (error) throw new Error(error.message);

      toast({
        title: "Success",
        description: "Device removed from group",
      });

      fetchGroup();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove device",
        variant: "error",
      });
    }
  };

  const handleLinkRepository = async () => {
    if (!selectedRepository) return;

    try {
      const { error } = await apiClient.linkRepositoryToGroup(
        id as string,
        selectedRepository
      );
      if (error) throw new Error(error.message);

      toast({
        title: "Success",
        description: "Repository linked to group",
      });

      setSelectedRepository("");
      fetchGroup();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link repository",
        variant: "error",
      });
    }
  };

  const handleUnlinkRepository = async (repositoryId: string) => {
    try {
      const { error } = await apiClient.unlinkRepositoryFromGroup(
        id as string,
        repositoryId
      );
      if (error) throw new Error(error.message);

      toast({
        title: "Success",
        description: "Repository unlinked from group",
      });

      fetchGroup();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlink repository",
        variant: "error",
      });
    }
  };

  if (!group) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/groups")}
        >
          Back to Groups
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
            <CardDescription>Manage group information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex justify-end">
                {isEditing ? (
                  <Button onClick={handleUpdateGroup}>Save Changes</Button>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Edit</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>Manage devices in this group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Select
                  value={selectedDevice}
                  onValueChange={setSelectedDevice}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices
                      .filter(
                        (device) =>
                          !group.devices.some(
                            (groupDevice) => groupDevice.device.id === device.id
                          )
                      )
                      .map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddDevice}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Device
                </Button>
              </div>
              <div className="space-y-2">
                {group.devices.map(({ device }) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{device.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDevice(device.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repositories</CardTitle>
            <CardDescription>
              Manage repositories linked to this group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Select
                  value={selectedRepository}
                  onValueChange={setSelectedRepository}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories
                      .filter(
                        (repo) =>
                          !group.repositories.some(
                            (groupRepo) => groupRepo.repository.id === repo.id
                          )
                      )
                      .map((repo) => (
                        <SelectItem key={repo.id} value={repo.id}>
                          {repo.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleLinkRepository}>
                  <Plus className="mr-2 h-4 w-4" />
                  Link Repository
                </Button>
              </div>
              <div className="space-y-2">
                {group.repositories.map(({ repository }) => (
                  <div
                    key={repository.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{repository.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnlinkRepository(repository.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
