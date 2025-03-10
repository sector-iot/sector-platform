import { Request, Response } from 'express';
import { prisma } from "@repo/database";
import { z } from 'zod';

// Validation schemas
const repositorySchema = {
  create: z.object({
    name: z.string().min(1, "Name is required"),
    url: z.string().url("Must be a valid URL"),
  }),
  update: z.object({
    name: z.string().optional(),
    url: z.string().url("Must be a valid URL").optional(),
  }),
  id: z.object({
    id: z.string().min(1, "Id is required"),
  }),
  deviceLink: z.object({
    deviceId: z.string().min(1, "Device ID is required"),
    repositoryId: z.string().min(1, "Repository ID is required"),
  })
};

export const repositoryController = {
  async createRepository(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const data = repositorySchema.create.parse(req.body);

      const repository = await prisma.repository.create({
        data: {
          ...data,
          userId: user.id,
        }
      });
      res.status(201).json(repository);
    } catch (error) {
      console.error('Error creating repository:', error);
      res.status(400).json({ error: 'Invalid repository data' });
    }
  },

  async getAllRepositories(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const repositories = await prisma.repository.findMany({
        where: {
          userId: user.id
        },
        include: { 
          devices: {
            where: {
              userId: user.id
            }
          },
          firmwareBuilds: true
        }
      });
      res.json(repositories);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getRepositoryById(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { id } = repositorySchema.id.parse(req.params);
      const repository = await prisma.repository.findUnique({
        where: { 
          id,
          userId: user.id
        },
        include: { 
          devices: {
            where: {
              userId: user.id
            }
          },
          firmwareBuilds: true
        }
      });

      if (!repository) return res.status(404).json({ error: 'Repository not found' });
      // Remove this line since we already filtered by userId in the query
      // if (repository.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });
      res.json(repository);
    } catch (error) {
      console.error('Error fetching repository:', error);
      res.status(400).json({ error: 'Invalid repository ID' });
    }
  },

  async updateRepository(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { id } = repositorySchema.id.parse(req.params);
      
      const existingRepository = await prisma.repository.findUnique({ where: { id } });
      if (!existingRepository) return res.status(404).json({ error: 'Repository not found' });
      if (existingRepository.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

      const data = repositorySchema.update.parse(req.body);

      const repository = await prisma.repository.update({
        where: { id },
        data
      });
      res.json(repository);
    } catch (error) {
      console.error('Error updating repository:', error);
      res.status(400).json({ error: 'Invalid update data' });
    }
  },

  async deleteRepository(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { id } = repositorySchema.id.parse(req.params);
      
      const existingRepository = await prisma.repository.findUnique({ where: { id } });
      if (!existingRepository) return res.status(404).json({ error: 'Repository not found' });
      if (existingRepository.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

      await prisma.repository.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting repository:', error);
      res.status(400).json({ error: 'Invalid repository ID' });
    }
  },

  async linkDeviceToRepository(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { deviceId, repositoryId } = repositorySchema.deviceLink.parse(req.body);

      // Check if both device and repository exist and belong to the user
      const device = await prisma.device.findUnique({ 
        where: { 
          id: deviceId,
          userId: user.id
        } 
      });
      const repository = await prisma.repository.findUnique({ 
        where: { 
          id: repositoryId,
          userId: user.id
        } 
      });

      if (!device) return res.status(404).json({ error: 'Device not found' });
      if (!repository) return res.status(404).json({ error: 'Repository not found' });

      // Update device with repository link
      const updatedDevice = await prisma.device.update({
        where: { 
          id: deviceId,
          userId: user.id
        },
        data: { repositoryId },
        include: { repository: true }
      });

      res.json(updatedDevice);
    } catch (error) {
      console.error('Error linking device to repository:', error);
      res.status(400).json({ error: 'Invalid link data' });
    }
  },

  async unlinkDeviceFromRepository(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { deviceId } = z.object({ deviceId: z.string() }).parse(req.params);

      const device = await prisma.device.findUnique({ 
        where: { 
          id: deviceId,
          userId: user.id
        } 
      });
      if (!device) return res.status(404).json({ error: 'Device not found' });

      const updatedDevice = await prisma.device.update({
        where: { 
          id: deviceId,
          userId: user.id
        },
        data: { repositoryId: null }
      });

      res.json(updatedDevice);
    } catch (error) {
      console.error('Error unlinking device from repository:', error);
      res.status(400).json({ error: 'Invalid device ID' });
    }
  }
};