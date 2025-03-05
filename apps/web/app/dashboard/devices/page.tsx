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
import { Battery, GitBranch, Power, Wifi } from "lucide-react";
import { useState } from "react";

const devices = [
  {
    id: "device-001",
    name: "Temperature Sensor 1",
    status: "online",
    battery: 85,
    signal: 90,
    repository: "temp-sensor-firmware",
    lastUpdate: "2024-03-20 14:30",
  },
  {
    id: "device-002",
    name: "Humidity Monitor",
    status: "online",
    battery: 72,
    signal: 85,
    repository: "humidity-monitor-fw",
    lastUpdate: "2024-03-19 09:15",
  },
  {
    id: "device-003",
    name: "Motion Detector",
    status: "offline",
    battery: 15,
    signal: 0,
    repository: "motion-detect-code",
    lastUpdate: "2024-03-18 23:45",
  },
];

export default function DevicesPage() {
  const [isAddingDevice, setIsAddingDevice] = useState(false);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Devices</h2>
          <p className="text-muted-foreground">
            Manage and monitor your IoT devices
          </p>
        </div>
        <Dialog open={isAddingDevice} onOpenChange={setIsAddingDevice}>
          <DialogTrigger asChild>
            <Button>Add Device</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
              <DialogDescription>
                Enter the details of your new IoT device.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name</Label>
                <Input id="name" placeholder="Enter device name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id">Device ID</Label>
                <Input id="id" placeholder="Enter device ID" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repository">Git Repository</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select repository" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repo1">Temperature Sensor Firmware</SelectItem>
                    <SelectItem value="repo2">Humidity Monitor Firmware</SelectItem>
                    <SelectItem value="repo3">Motion Detector Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsAddingDevice(false)}>Add Device</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => (
          <Card key={device.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {device.name}
                <Power
                  className={`h-5 w-5 ${
                    device.status === "online"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                />
              </CardTitle>
              <CardDescription>{device.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Battery className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{device.battery}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{device.signal}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{device.repository}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {device.lastUpdate}
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
        ))}
      </div>
    </div>
  );
}