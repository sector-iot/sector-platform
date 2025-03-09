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

import { apiClient } from "@/lib/api-client";
import { Device } from "@repo/database";
import { useEffect, useState } from "react";

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newDeviceAdded, setNewDeviceAdded] = useState<boolean>(false);

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Devices</h2>
          <p className="text-muted-foreground">
            Manage and monitor your IoT devices
          </p>
        </div>
        <AddDeviceDialog setNewDeviceAdded={setNewDeviceAdded} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devices && devices.length > 0 ? (
          devices.map((device) => (
            <Card key={device.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {device.name}
                </CardTitle>
                <CardDescription>{device.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Last updated:{" "}
                      {new Date(device.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleUpdateDevice(device.id)}
                    >
                      Update
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : loading ? (
          <span>Loading...</span>
        ) : (
          <div>No devices found</div>
        )}
      </div>
    </div>
  );
}
