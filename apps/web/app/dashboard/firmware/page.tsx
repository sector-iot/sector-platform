"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { FirmwareBuilds } from "@repo/database";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

export default function FirmwareBuildsPage() {
  const { toast } = useToast();
  const [firmwareBuilds, setFirmwareBuilds] = useState<FirmwareBuilds[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFirmwareBuilds();
  }, []);

  const fetchFirmwareBuilds = async () => {
    try {
      const response = await apiClient.getFirmwareBuilds();
      if (response.error) {
        throw new Error(response.error.message);
      }
      setFirmwareBuilds(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch firmware builds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge variant="success">Success</Badge>;
      case "BUILDING":
        return <Badge variant="secondary">Building</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[100px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Firmware Builds</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {firmwareBuilds.map((build) => (
          <Card key={build.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>v{build.version}</span>
                {getStatusBadge(build.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {build.repository?.name}
                </div>
                {build.group && (
                  <div className="text-sm text-muted-foreground">
                    Group: {build.group.name}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(build.createdAt), {
                    addSuffix: true,
                  })}
                </div>
                {build.url && (
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => window.open(build.url, "_blank")}
                  >
                    Download
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
