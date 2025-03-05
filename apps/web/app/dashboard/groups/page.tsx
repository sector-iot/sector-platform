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
import { Boxes, GitBranch, Power } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const groups = [
  {
    id: "group-001",
    name: "Temperature Sensors",
    deviceCount: 5,
    onlineCount: 4,
    repository: "temp-sensor-firmware",
    lastUpdate: "2024-03-20 14:30",
  },
  {
    id: "group-002",
    name: "Humidity Monitors",
    deviceCount: 3,
    onlineCount: 3,
    repository: "humidity-monitor-fw",
    lastUpdate: "2024-03-19 09:15",
  },
  {
    id: "group-003",
    name: "Motion Detectors",
    deviceCount: 4,
    onlineCount: 2,
    repository: "motion-detect-code",
    lastUpdate: "2024-03-18 23:45",
  },
];

const availableDevices = [
  { id: "device1", name: "Temperature Sensor 1" },
  { id: "device2", name: "Temperature Sensor 2" },
  { id: "device3", name: "Humidity Monitor 1" },
  { id: "device4", name: "Motion Detector 1" },
  { id: "device5", name: "Temperature Sensor 3" },
];

export default function GroupsPage() {
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDevices(current =>
      current.includes(deviceId)
        ? current.filter(id => id !== deviceId)
        : [...current, deviceId]
    );
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
            <Button>Create Group</Button>
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
                <Input id="name" placeholder="Enter group name" />
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
              <div className="space-y-2">
                <Label>Select Devices</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-[200px] overflow-y-auto">
                  {availableDevices.map((device) => (
                    <div key={device.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={device.id}
                        checked={selectedDevices.includes(device.id)}
                        onCheckedChange={() => handleDeviceToggle(device.id)}
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
              <Button onClick={() => {
                setIsAddingGroup(false);
                setSelectedDevices([]);
              }}>Create Group</Button>
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
              </CardTitle>
              <CardDescription>{group.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Power className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {group.onlineCount}/{group.deviceCount} online
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{group.repository}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {group.lastUpdate}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    Update All
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