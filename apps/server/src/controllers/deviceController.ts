import { Request, Response } from 'express';
import { prisma, Prisma } from "@repo/database";
import { DeviceModel } from '@repo/database';
import { z } from 'zod';

// Validation schemas
const deviceSchema = {
  create: z.object({
    name: z.string().min(1, "Name is required"),
    model: z.nativeEnum(DeviceModel).default(DeviceModel.ESP32),
    repository: z.object({
      connect: z.object({
        id: z.string()
      })
    }).optional()
  }),
  update: z.object({
    name: z.string().optional(),
    model: z.nativeEnum(DeviceModel).optional(),
    repository: z.object({
      connect: z.object({
        id: z.string()
      })
    }).optional()
  }),
  id: z.object({
    id: z.string().min(1, "Id is required"),
  })
};

export const deviceController = {
  async createDevice(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const data = deviceSchema.create.parse(req.body);

      // If repository is provided, verify it belongs to the user
      if (data.repository?.connect?.id) {
        const repository = await prisma.repository.findUnique({
          where: {
            id: data.repository.connect.id,
            userId: user.id
          }
        });
        if (!repository) {
          return res.status(404).json({ error: 'Repository not found' });
        }
      }

      const device = await prisma.device.create({
        data: {
          name: data.name,
          model: data.model,
          userId: user.id,
          repository: data.repository
        } as Prisma.DeviceUncheckedCreateInput
      });
      res.status(201).json(device);
    } catch (error) {
      console.error('Error creating device:', error);
      res.status(400).json({ error: 'Invalid device data' });
    }
  },

  async getAllDevices(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const devices = await prisma.device.findMany({
        include: { 
          user: true,
          repository: true 
        },
        where: {
          userId: user.id
        }
      });
      res.json(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getDeviceById(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { id } = deviceSchema.id.parse(req.params);
      const device = await prisma.device.findUnique({
        where: { id },
        include: { 
          user: true,
          repository: true 
        }
      });

      if (!device) return res.status(404).json({ error: 'Device not found' });
      if (device.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

      res.json(device);
    } catch (error) {
      console.error('Error fetching device:', error);
      res.status(400).json({ error: 'Invalid device ID' });
    }
  },

  async updateDevice(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { id } = deviceSchema.id.parse(req.params);
      
      const existingDevice = await prisma.device.findUnique({ where: { id } });
      if (!existingDevice) return res.status(404).json({ error: 'Device not found' });
      if (existingDevice.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

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
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { id } = deviceSchema.id.parse(req.params);
      
      const existingDevice = await prisma.device.findUnique({ where: { id } });
      if (!existingDevice) return res.status(404).json({ error: 'Device not found' });
      if (existingDevice.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

      await prisma.device.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(400).json({ error: 'Invalid device ID' });
    }
  }
};