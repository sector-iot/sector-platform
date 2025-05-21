"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Boxes, GitBranch, Power, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface Group {
  id: string;
  name: string;
  description?: string;
  devices: Device[];
  repository: Repository | null;
}

interface Device {
  id: string;
  name: string;
}

interface Repository {
  id: string;
  name: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchGroups();
    fetchDevices();
    fetchRepositories();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await apiClient.getGroups();
      if (error) throw new Error(error.message);
      // Transform data to match Group type
      const transformedData = (data || []).map((group) => ({
        ...group,
        description: group.description || undefined, // Ensure description is undefined if null
      }));
      setGroups(transformedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch groups",
        variant: "error", // Updated from "destructive" to "error"
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
        variant: "error", // Updated from "destructive" to "error"
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
        variant: "error", // Updated from "destructive" to "error"
      });
    }
  };

  const handleCreateGroup = async () => {
    try {
      const { data: group, error: createError } = await apiClient.createGroup({
        name: newGroupName,
        description: newGroupDescription,
      });
      if (createError) throw new Error(createError.message);

      if (!group) {
        toast({
          title: "Error",
          description: "Failed to create group - group data is missing",
          variant: "error",
        });
        return;
      }

      // Add selected devices to the group
      for (const deviceId of selectedDevices) {
        const { error: deviceError } = await apiClient.addDeviceToGroup(
          group.id,
          deviceId
        );
        if (deviceError) throw new Error(deviceError.message);
      }

      // Link repository if selected
      if (selectedRepository) {
        const { error: repoError } = await apiClient.linkRepositoryToGroup(
          group.id,
          selectedRepository
        );
        if (repoError) throw new Error(repoError.message);
      }

      toast({
        title: "Success",
        description: "Group created successfully",
      });

      setIsAddingGroup(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedDevices([]);
      setSelectedRepository("");
      fetchGroups();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "error",
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const group = groups.find((g) => g.id === groupId);
      if (!group) {
        toast({
          title: "Error",
          description: "Group not found",
          variant: "error",
        });
        return;
      }
      const { error } = await apiClient.deleteGroup(group.id);
      if (error) throw new Error(error.message);

      toast({
        title: "Success",
        description: "Group deleted successfully",
      });

      fetchGroups();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "error", // Updated from "destructive" to "error"
      });
    }
  };

  const handleRemoveDevice = async (groupId: string, deviceId: string) => {
    try {
      const { error } = await apiClient.removeDeviceFromGroup(
        groupId,
        deviceId
      );
      if (error) throw new Error(error.message);

      toast({
        title: "Success",
        description: "Device removed from group",
      });

      fetchGroups();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove device",
        variant: "error", // Updated from "destructive" to "error"
      });
    }
  };

  const handleUnlinkRepository = async (
    groupId: string,
    repositoryId: string
  ) => {
    try {
      const { error } = await apiClient.unlinkRepositoryFromGroup(
        groupId,
        repositoryId
      );
      if (error) throw new Error(error.message);

      toast({
        title: "Success",
        description: "Repository unlinked from group",
      });

      fetchGroups();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlink repository",
        variant: "error", // Updated from "destructive" to "error"
      });
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Device Groups</h2>
          <p className="text-muted-foreground">
            Manage and organize your IoT devices in groups
          </p>
        </div>
        <Dialog open={isAddingGroup} onOpenChange={setIsAddingGroup}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Device Group</DialogTitle>
              <DialogDescription>
                Create a new group to manage multiple devices together.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="Enter group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter group description"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repository">Git Repository</Label>
                <Select
                  value={selectedRepository}
                  onValueChange={setSelectedRepository}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id}>
                        {repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Devices</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-[200px] overflow-y-auto">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={device.id}
                        checked={selectedDevices.includes(device.id)}
                        onCheckedChange={() => {
                          setSelectedDevices((current) =>
                            current.includes(device.id)
                              ? current.filter((id) => id !== device.id)
                              : [...current, device.id]
                          );
                        }}
                      />
                      <label
                        htmlFor={device.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {device.name}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedDevices.length} devices selected
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateGroup}>Create Group</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Boxes className="h-5 w-5" />
                  <span>{group.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteGroup(group.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                {group.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Devices</h4>
                  <div className="space-y-2">
                    {group.devices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{device.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveDevice(group.id, device.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                {group.repository && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Repository</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{group.repository.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleUnlinkRepository(
                              group.id,
                              group.repository!.id
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/groups/${group.id}`)}
                  >
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
