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
import { GitBranch, GitCommit, GitPullRequest } from "lucide-react";
import { useState } from "react";

const initialRepositories = [
  {
    id: "repo-001",
    name: "Temperature Sensor Firmware",
    url: "https://github.com/org/temp-sensor-firmware",
    branch: "main",
    lastCommit: "feat: Update sensor calibration",
    devices: 5,
    lastUpdate: "2024-03-20 14:30",
  },
  {
    id: "repo-002",
    name: "Humidity Monitor Firmware",
    url: "https://github.com/org/humidity-monitor-fw",
    branch: "develop",
    lastCommit: "fix: Memory leak in sensor reading",
    devices: 3,
    lastUpdate: "2024-03-19 09:15",
  },
  {
    id: "repo-003",
    name: "Motion Detector Code",
    url: "https://github.com/org/motion-detect-code",
    branch: "main",
    lastCommit: "feat: Add new detection algorithm",
    devices: 4,
    lastUpdate: "2024-03-18 23:45",
  },
];

export default function RepositoriesPage() {
  const [isAddingRepo, setIsAddingRepo] = useState(false);
  const [repositories, setRepositories] = useState(initialRepositories);
  const [newRepo, setNewRepo] = useState({
    name: "",
    url: "",
    branch: "main",
  });

  const handleAddRepository = () => {
    if (!newRepo.name || !newRepo.url) return; // Basic validation

    const newRepository = {
      id: `repo-${repositories.length + 1}`,
      name: newRepo.name,
      url: newRepo.url,
      branch: newRepo.branch,
      lastCommit: "Initial commit",
      devices: 0, // Assume no devices connected yet
      lastUpdate: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    setRepositories((prev) => [...prev, newRepository]);
    setIsAddingRepo(false);
    setNewRepo({ name: "", url: "", branch: "main" }); // Reset the form
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Git Repositories</h2>
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
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select
                  onValueChange={(value) =>
                    setNewRepo((prev) => ({ ...prev, branch: value }))
                  }
                  value={newRepo.branch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">main</SelectItem>
                    <SelectItem value="develop">develop</SelectItem>
                    <SelectItem value="staging">staging</SelectItem>
                  </SelectContent>
                </Select>
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
          <Card key={repo.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5" />
                  <span>{repo.name}</span>
                </div>
              </CardTitle>
              <CardDescription className="truncate">{repo.url}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GitCommit className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate">{repo.lastCommit}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Branch: {repo.branch}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-sm">{repo.devices} connected devices</p>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {repo.lastUpdate}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" className="flex-1">
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
