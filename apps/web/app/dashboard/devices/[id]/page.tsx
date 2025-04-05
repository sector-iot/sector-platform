"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DeviceModel } from "@repo/database";
import { apiClient } from "@/lib/api-client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const deviceSchema = z.object({
  name: z.string().min(2, "Device name must be at least 2 characters"),
  model: z.nativeEnum(DeviceModel, { required_error: "Please select a device model" }),
  repository: z.object({
    connect: z.object({
      id: z.string()
    })
  }).optional()
});

type DeviceFormData = z.infer<typeof deviceSchema>;

export default function EditDevicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema)
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deviceResponse, repositoriesResponse] = await Promise.all([
          apiClient.getDevice(params.id),
          apiClient.getRepositories()
        ]);

        if (deviceResponse.error) {
          toast.error("Failed to fetch device");
          router.push("/dashboard/devices");
          return;
        }

        if (repositoriesResponse.data) {
          setRepositories(repositoriesResponse.data);
        }

        if (deviceResponse.data) {
          form.reset({
            name: deviceResponse.data.name,
            model: deviceResponse.data.model,
            repository: deviceResponse.data.repositoryId ? {
              connect: { id: deviceResponse.data.repositoryId }
            } : undefined
          });
        }
      } catch (error) {
        toast.error("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, form, router]);

  const onSubmit = async (data: DeviceFormData) => {
    try {
      const response = await apiClient.updateDevice(params.id, data);
      if (response.error) {
        toast.error("Failed to update device");
        return;
      }
      toast.success("Device updated successfully");
      router.push("/dashboard/devices");
    } catch (error) {
      toast.error("An error occurred while updating the device");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Device</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/devices")}>
          Back to Devices
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter device name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Model</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ESP32">ESP32</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="repository"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linked Repository</FormLabel>
                <Select onValueChange={(value) => {
                  if (value === "none") {
                    field.onChange(undefined);
                  } else {
                    field.onChange({ connect: { id: value } });
                  }
                }} defaultValue={field.value?.connect?.id}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select repository" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id}>
                        {repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end pt-4">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 