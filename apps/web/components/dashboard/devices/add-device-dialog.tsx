"use client"
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useRouter } from 'next/navigation';
import { DeviceModel } from "@repo/database";

const deviceSchema = z.object({
    name: z.string().min(2, "Device name must be at least 2 characters"),
    model: z.nativeEnum(DeviceModel, { required_error: "Please select a device model" }),
    repository: z.object({
        connect: z.object({
            id: z.string()
        })
    }).optional()
})

type DeviceFormData = z.infer<typeof deviceSchema>

export default function AddDeviceDialog({
    setNewDeviceAdded
}:{
    setNewDeviceAdded: (newDeviceAdded: boolean) => void
}) {
    const [isAddingDevice, setIsAddingDevice] = useState(false);
    const [loading, setLoading] = useState(false);
    const [repositories, setRepositories] = useState<{ id: string; name: string }[]>([]);
    const router = useRouter();

    const form = useForm<DeviceFormData>({
        resolver: zodResolver(deviceSchema)
    })

    useEffect(() => {
        const fetchRepositories = async () => {
            const response = await apiClient.getRepositories();
            if (response.data) {
                setRepositories(response.data);
            }
        };

        if (isAddingDevice) {
            fetchRepositories();
        }
    }, [isAddingDevice]);

    const onSubmit = async (data: DeviceFormData) => {
        setLoading(true)
        try {
            const response = await apiClient.createDevice({
                name: data.name,
                model: data.model,
                repository: data.repository
            })
            if (!response.error) {
                setIsAddingDevice(false)
                setNewDeviceAdded(true)
                form.reset()
            } else {
                alert("Failed to create device")
            }
        } catch (error) {
            alert("An error occurred while creating the device")
        } finally {
            setLoading(false)
        }
    }

    return (
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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                            <Button type="submit" disabled={loading}>
                                {loading ? "Adding..." : "Add Device"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
