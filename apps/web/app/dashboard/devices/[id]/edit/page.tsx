'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from '@/lib/api-client';
import { DeviceModel } from "@repo/database";

const deviceSchema = z.object({
  name: z.string().min(2, "Device name must be at least 2 characters"),
  model: z.nativeEnum(DeviceModel, { required_error: "Please select a device model" }),
  repositoryId: z.string().optional()
});

type DeviceFormData = z.infer<typeof deviceSchema>;

export default function EditDevicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [repositories, setRepositories] = useState<{ id: string; name: string }[]>([]);
  const [device, setDevice] = useState<any>(null);

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema)
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deviceResponse, reposResponse] = await Promise.all([
          apiClient.getDevice(params.id),
          apiClient.getRepositories()
        ]);

        if (deviceResponse.data) {
          setDevice(deviceResponse.data);
          form.reset({
            name: deviceResponse.data.name,
            model: deviceResponse.data.model,
            repositoryId: deviceResponse.data.repositoryId || ''
          });
        }

        if (reposResponse.data) {
          setRepositories(reposResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [params.id, form]);

  const onSubmit = async (data: DeviceFormData) => {
    setLoading(true);
    try {
      const response = await apiClient.updateDevice(params.id, {
        name: data.name,
        model: data.model,
        repository: data.repositoryId ? { connect: { id: data.repositoryId } } : undefined
      });

      if (!response.error) {
        router.push('/dashboard/devices');
      } else {
        alert("Failed to update device");
      }
    } catch (error) {
      alert("An error occurred while updating the device");
    } finally {
      setLoading(false);
    }
  };

  if (!device) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Edit Device</h2>
        <p className="text-muted-foreground">
          Update your device details
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
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
            name="repositoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linked Repository</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select repository" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/devices')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 