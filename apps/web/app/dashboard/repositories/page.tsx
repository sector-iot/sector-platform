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
import { apiClient } from "@/lib/api-client";
import { Repository } from "@repo/database";
import { GitBranch, GitCommit, GitPullRequest } from "lucide-react";
import { useEffect, useState } from "react";





export default function RepositoriesPage() {
  const [loading, setLoading] = useState<boolean>(true);
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
  
    const getRepositories = async () => {
      setLoading(true);
      const repositoryResponse = await apiClient.getRepositories();
      if (repositoryResponse.error) {
        setLoading(false);
        return;
      } else if (repositoryResponse.data) {
        // Sort devices alphabetically by name, and by createdAt if names are the same
        // const sortedDevices = [...devicesResponse.data].sort((a, b) => {
        //   const nameComparison = a.name.localeCompare(b.name);
        //   if (nameComparison !== 0) {
        //     return nameComparison; // Primary sorting by name
        //   }
        //   return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Secondary sorting by createdAt
        // });
        setRepositories(repositoryResponse.data);
      }
      setLoading(false);
    };

  const handleAddRepository = async () => {
    if (!newRepo.name || !newRepo.url) return; // Basic validation

    const response = await apiClient.createRepository({
      name: newRepo.name, url: newRepo.url
    })

    setIsAddedRepo(true);
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
