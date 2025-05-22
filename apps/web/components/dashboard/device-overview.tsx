"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, GitBranch, FolderGit2, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { apiClient } from "@/lib/api-client";
import { Device, FirmwareBuilds, Repository, Group } from "@repo/database";
import { Skeleton } from "@/components/ui/skeleton";

type DeviceWithRepository = Device & {
  repository: Repository | null;
};

type GroupWithRelations = Group & {
  devices: Device[];
  repository: Repository | null;
};

export function DeviceOverview() {
  const [devices, setDevices] = useState<DeviceWithRepository[]>([]);
  const [firmwareBuilds, setFirmwareBuilds] = useState<FirmwareBuilds[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [groups, setGroups] = useState<GroupWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [
          deviceResponse,
          firmwareResponse,
          repositoryResponse,
          groupResponse,
        ] = await Promise.all([
          apiClient.getDevices(),
          apiClient.getFirmwareBuilds(),
          apiClient.getRepositories(),
          apiClient.getGroups(),
        ]);

        if (deviceResponse.error) {
          throw new Error(deviceResponse.error.message);
        }
        if (firmwareResponse.error) {
          throw new Error(firmwareResponse.error.message);
        }
        if (repositoryResponse.error) {
          throw new Error(repositoryResponse.error.message);
        }
        if (groupResponse.error) {
          throw new Error(groupResponse.error.message);
        }

        setDevices(deviceResponse.data || []);
        setFirmwareBuilds(firmwareResponse.data || []);
        setRepositories(repositoryResponse.data || []);
        setGroups(groupResponse.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Count statistics
  const totalDevicesCount = devices.length;
  const totalRepositoriesCount = repositories.length;
  const totalGroupsCount = groups.length;

  // Count active updates (firmware builds with status "BUILDING")
  const activeUpdatesCount = firmwareBuilds.filter(
    (build) => build.status === "BUILDING"
  ).length;

  // Prepare firmware builds timeline data
  const firmwareTimelineData = firmwareBuilds
    .filter((build) => build.createdAt)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map((build) => {
      const date = new Date(build.createdAt);
      // Extract major version number from version string (e.g., "1.2.3" -> 1)
      const majorVersion = build.version
        ? parseInt(build.version.toString().split(".")[0])
        : 0;
      return {
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        version: majorVersion,
        status: build.status,
        statusValue:
          build.status === "SUCCESS" ? 2 : build.status === "BUILDING" ? 1 : 0,
      };
    });

  // Get recent activity based on firmware builds and device status
  const recentActivity = firmwareBuilds
    .filter((build) => build.createdAt)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3)
    .map((build) => ({
      icon: GitBranch,
      title: `Firmware ${build.status}`,
      description: `Version ${build.version} for repo ${build.repositoryId.slice(0, 8)}`,
      date: new Date(build.createdAt).toLocaleString(),
    }));

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        Error loading dashboard data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalDevicesCount}</div>
                <p className="text-xs text-muted-foreground">
                  {totalDevicesCount > 0
                    ? `Manage your fleet of devices`
                    : "Add your first device"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Repositories
            </CardTitle>
            <FolderGit2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {totalRepositoriesCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalRepositoriesCount > 0
                    ? `Source code repositories`
                    : "Add your first repository"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Updates
            </CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeUpdatesCount}</div>
                <p className="text-xs text-muted-foreground">
                  {activeUpdatesCount === 1
                    ? "Update in progress"
                    : activeUpdatesCount > 1
                      ? "Updates in progress"
                      : "No active updates"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalGroupsCount}</div>
                <p className="text-xs text-muted-foreground">
                  {totalGroupsCount > 0
                    ? `Device organization groups`
                    : "Create groups to organize devices"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Firmware Build Timeline</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loading ? (
              <div className="h-[350px] flex items-center justify-center">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : firmwareTimelineData.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No firmware build data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={firmwareTimelineData}>
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, "dataMax"]}
                    allowDecimals={false}
                    tickFormatter={(value) => `v${value}`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "statusValue") return null;
                      return name === "version" ? `v${value}` : value;
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="version"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Version"
                  />
                  <Line
                    type="monotone"
                    dataKey="statusValue"
                    stroke="#82ca9d"
                    name="Build Status"
                    dot={{
                      stroke: "#82ca9d",
                      strokeWidth: 2,
                      r: 4,
                      strokeDasharray: "",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-8">
                {recentActivity.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">
                      {item.date}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Activity className="h-12 w-12 mb-2 opacity-20" />
                <p>No recent activity</p>
                <p className="text-sm">
                  Activity will appear here when you create firmware builds
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
