"use client";
import AddDeviceDialog from "@/components/dashboard/devices/add-device-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Pencil, Cpu, GitBranch, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { apiClient } from "@/lib/api-client";
import { Device } from "@repo/database";
import { useEffect, useState } from "react";

type DeviceWithRepository = Device & {
  repository: {
    name: string;
    id: string;
  } | null;
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceWithRepository[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newDeviceAdded, setNewDeviceAdded] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    getDevices();
  }, [newDeviceAdded]);

  const getDevices = async () => {
    setLoading(true);
    const devicesResponse = await apiClient.getDevices();
    if (devicesResponse.error) {
      setLoading(false);
      return;
    } else if (devicesResponse.data) {
      // Sort devices alphabetically by name, and by createdAt if names are the same
      const sortedDevices = [...devicesResponse.data].sort((a, b) => {
        const nameComparison = a.name.localeCompare(b.name);
        if (nameComparison !== 0) {
          return nameComparison; // Primary sorting by name
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Secondary sorting by createdAt
      });
      setDevices(sortedDevices);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Device ID copied to clipboard');
  };

  const handleUpdateDevice = async (deviceId: string) => {
    // Fetch the current device data first
    const currentDevice = await apiClient.getDevice(deviceId);

    if (currentDevice.error) {
      console.error("Error fetching device:", currentDevice.error.message);
      return;
    }

    // Retain the original name and update only the fields you want
    const updatedDeviceData = {
      name: currentDevice.data?.name, // Retain the original name
      updatedAt: new Date().toISOString(), // Update timestamp
    };

    const response = await apiClient.updateDevice(deviceId, updatedDeviceData);

    if (response.error) {
      console.error("Error updating device:", response.error.message);
      return;
    }

    // Refresh the device list after a successful update
    setNewDeviceAdded(!newDeviceAdded);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Devices</h1>
        <AddDeviceDialog setNewDeviceAdded={setNewDeviceAdded} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => (
          <Card key={device.id} className="group relative hover:shadow-lg transition-shadow">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/dashboard/devices/${device.id}`)}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-muted-foreground" />
                {device.name}
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">ID: {device.id}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(device.id)}
                    className="h-6 w-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Model:</span>
                  <span className="text-muted-foreground">{device.model}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span className="text-muted-foreground">
                    {new Date(device.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {device.repository && (
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Repository:</span>
                    <span className="text-muted-foreground">{device.repository.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
