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
import { Device } from "@repo/database";

const deviceLinkSchema = z.object({
    deviceId: z.string({ required_error: "Please select a device" })
})

type DeviceLinkFormData = z.infer<typeof deviceLinkSchema>;

export default function DeviceLinker({ repositoryId }: { repositoryId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [devices, setDevices] = useState<Device[]>([]);
    const [newDeviceLinked, setNewDeviceLinked] = useState(false);

    const form = useForm<DeviceLinkFormData>({
        resolver: zodResolver(deviceLinkSchema)
    });

    // Fetch devices when the modal opens
    useEffect(() => {
        if (isModalOpen) {
            fetchDevices();
        }
    }, [isModalOpen]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await apiClient.getDevices();
            if (response.data) {
                setDevices(response.data);
            } else {
                alert(response.error?.message || "Failed to fetch devices");
            }
        } catch (error) {
            alert("An error occurred while fetching devices");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: DeviceLinkFormData) => {
        setLoading(true);
        try {
            const response = await apiClient.linkDeviceToRepository(data.deviceId, repositoryId);
            if (!response.error) {
                setIsModalOpen(false);
                setNewDeviceLinked(true);
                alert("Device linked successfully!");
            } else {
                alert(response.error.message || "Failed to link device");
            }
        } catch (error) {
            alert("An error occurred while linking the device");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button>Configure</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Link Device to Repository</DialogTitle>
                    <DialogDescription>Select a device to link to this repository.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="deviceId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Select Device</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a device" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {devices.map((device) => (
                                                <SelectItem key={device.id} value={device.id}>
                                                    {device.name}
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
                                {loading ? "Linking..." : "Link Device"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
