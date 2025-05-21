"use client";

import { Device } from "@repo/database";
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
import { apiClient } from "@/lib/api-client";
import { Repository } from "@repo/database";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Trash2,
  Copy,
} from "lucide-react";
import { useEffect, useState } from "react";
import DeviceLinker from "@/components/dashboard/device-linker";
import { toast } from "sonner";

export default function RepositoriesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingRepo, setIsAddingRepo] = useState(false);
  const [isAddedRepo, setIsAddedRepo] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [newRepo, setNewRepo] = useState({
    name: "",
    url: "",
    branch: "main",
  });

  useEffect(() => {
    getRepositories();
  }, [isAddedRepo]);

  useEffect(() => {
    if (isOpen) {
      getDevices();
    }
  }, [isOpen]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Repository ID copied to clipboard");
  };

  const getRepositories = async () => {
    setLoading(true);
    const repositoryResponse = await apiClient.getRepositories();
    if (repositoryResponse.error) {
      setLoading(false);
      return;
    } else if (repositoryResponse.data) {
      setRepositories(repositoryResponse.data);
    }
    setLoading(false);
  };

  const linkDeviceToRepo = async (deviceId: string) => {
    try {
      const response = await apiClient.linkDeviceToRepository(
        deviceId,
        deviceId
      );
      if (!response.error) {
        toast.success("Device linked successfully!");
        setIsOpen(false);
      } else {
        toast.error("Failed to link device");
      }
    } catch (error) {
      toast.error("An error occurred while linking the device");
    }
  };

  const handleAddRepository = async () => {
    if (!newRepo.name || !newRepo.url) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await apiClient.createRepository({
        name: newRepo.name,
        url: newRepo.url,
      });

      if (response.error) {
        toast.error("Failed to create repository");
        return;
      }

      toast.success("Repository created successfully");
      setIsAddedRepo(true);
      setIsAddingRepo(false);
      setNewRepo({ name: "", url: "", branch: "main" });
    } catch (error) {
      toast.error("An error occurred while creating the repository");
    }
  };

  const handleDeleteRepository = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this repository? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await apiClient.deleteRepository(id);
      if (response.error) {
        toast.error("Failed to delete repository");
        return;
      }

      toast.success("Repository deleted successfully");
      getRepositories();
    } catch (error) {
      toast.error("An error occurred while deleting the repository");
    }
  };

  const getDevices = async () => {
    setLoading(true);
    const devicesResponse = await apiClient.getDevices();
    if (devicesResponse.error) {
      setLoading(false);
      return;
    } else if (devicesResponse.data) {
      const sortedDevices = [...devicesResponse.data].sort((a, b) => {
        const nameComparison = a.name.localeCompare(b.name);
        if (nameComparison !== 0) {
          return nameComparison;
        }
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      setDevices(sortedDevices);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Git Repositories
          </h2>
          <p className="text-muted-foreground">
            Manage firmware and software repositories for your IoT devices
          </p>
        </div>
        <Dialog open={isAddingRepo} onOpenChange={setIsAddingRepo}>
          <DialogTrigger asChild>
            <Button>Add Repository</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Git Repository</DialogTitle>
              <DialogDescription>
                Connect a Git repository for device updates.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Repository Name</Label>
                <Input
                  id="name"
                  value={newRepo.name}
                  onChange={(e) =>
                    setNewRepo((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter repository name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Repository URL</Label>
                <Input
                  id="url"
                  value={newRepo.url}
                  onChange={(e) =>
                    setNewRepo((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="https://github.com/org/repo"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddRepository}>Add Repository</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {repositories.map((repo) => (
          <Card key={repo.id} className="group relative">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRepository(repo.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5" />
                  <span>{repo.name}</span>
                </div>
              </CardTitle>
              <CardDescription className="truncate">{repo.url}</CardDescription>
              <div className="mt-2 flex items-center text-sm text-muted-foreground">
                <span className="mr-2">ID: {repo.id}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(repo.id)}
                  className="h-6 w-6 hover:bg-accent hover:text-accent-foreground"
                  title="Copy ID"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(repo.url, "_blank")}
                  >
                    View Details
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
