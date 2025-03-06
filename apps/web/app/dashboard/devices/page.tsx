"use client"
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
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [newDeviceAdded, setNewDeviceAdded] = useState<boolean>(false)


  useEffect(() => {
    getDevices()
  }, [newDeviceAdded])
 
  const getDevices = async () => {
    setLoading(true)
    const devices = await apiClient.getDevices();
    if (devices.error) {
      setLoading(false)
      return
    } else if (devices.data) {
      setDevices(devices.data)
      console.log(devices.data)
    }
    setLoading(false)
  }
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
        {devices && devices.length > 0 ? devices.map((device) => (
          <Card key={device.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {device.name}
              </CardTitle>
              <CardDescription>{device.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {/* <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{device.repository}</span> */}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(device.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    Update
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : loading ? <span>Loading...</span> : <div>No devices found</div>}
      </div>
    </div>
  );
}