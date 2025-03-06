import { Request, Response } from 'express';
import { prisma } from "@repo/database";
import { DeviceModel } from '@repo/database';
import { z } from 'zod';

// Validation schemas
const deviceSchema = {
  create: z.object({
    name: z.string().min(1, "Name is required"),
    model: z.nativeEnum(DeviceModel).default(DeviceModel.ESP32),
  }),
  update: z.object({
    name: z.string().optional(),
    model: z.nativeEnum(DeviceModel).optional(),
  }),
  id: z.object({
    id: z.string().min(1, "Id is required"),
  })
};

export const deviceController = {
  async createDevice(req: Request, res: Response) {
    const user = req.user;
    try {
      const data = deviceSchema.create.parse(req.body);

      const device = await prisma.device.create({
        data: {
          ...data,
          userId: user?.id as string,
        }
      });
      res.status(201).json(device);
    } catch (error) {
      console.error('Error creating device:', error);
      res.status(400).json({ error: 'Invalid device data' });
    }
  },

  async getAllDevices(req: Request, res: Response) {
    try {
      const devices = await prisma.device.findMany({
        include: { user: true },
        where: {
          userId: req.user?.id as string
        }
      });
      console.log(devices)
      res.json(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getDeviceById(req: Request, res: Response) {
    try {
      const { id } = deviceSchema.id.parse(req.params);
      const device = await prisma.device.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!device) return res.status(404).json({ error: 'Device not found' });
      res.json(device);
    } catch (error) {
      console.error('Error fetching device:', error);
      res.status(400).json({ error: 'Invalid device ID' });
    }
  },

  async updateDevice(req: Request, res: Response) {
    try {
      const { id } = deviceSchema.id.parse(req.params);
      const data = deviceSchema.update.parse(req.body);

      const device = await prisma.device.update({
        where: { id },
        data
      });
      res.json(device);
    } catch (error) {
      console.error('Error updating device:', error);
      res.status(400).json({ error: 'Invalid update data' });
    }
  },

  async deleteDevice(req: Request, res: Response) {
    try {
      const { id } = deviceSchema.id.parse(req.params);
      await prisma.device.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(400).json({ error: 'Invalid device ID' });
    }
  }
};