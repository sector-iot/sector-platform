import { Request, Response } from 'express';
import { prisma } from "@repo/database";
import { z } from 'zod';

// Validation schemas
const firmwareBuildSchema = {
  create: z.object({
    url: z.string().url("Must be a valid URL").optional(),
    repositoryId: z.string().min(1, "Repository ID is required"),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must follow semver format (MAJOR.MINOR.PATCH)").optional(),
  }),
  update: z.object({
    url: z.string().url("Must be a valid URL").optional(),
    status: z.enum(['BUILDING', 'SUCCESS', 'FAILED']).optional(),
  }),
  id: z.object({
    id: z.string().min(1, "Id is required"),
  }),
};

export const firmwareBuildController = {
  async createFirmwareBuild(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const data = firmwareBuildSchema.create.parse(req.body);

      // Verify repository exists and belongs to user
      const repository = await prisma.repository.findUnique({
        where: {
          id: data.repositoryId,
          userId: user.id
        }
      });

      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }
      let nextVersion
      // If version is provided in the request, use it (e.g. from GitHub Actions)
      if (data.version) {
        // Version format is already validated by schema
        nextVersion = data.version;
      } else {
        // Find the latest version for this repository
        const latestBuild = await prisma.firmwareBuilds.findFirst({
          where: { repositoryId: data.repositoryId },
          orderBy: { version: 'desc' }
        });

        // If no previous build exists, start with 0.1.0
        if (!latestBuild) {
          nextVersion = '0.1.0';
        } else {
          // Parse the latest version
          const [major, minor, patch] = latestBuild.version?.toString().split('.').map(Number);
          // Increment patch version
          nextVersion = `${major}.${minor}.${patch + 1}`;
        }
      }
      console.log('Next version:', nextVersion);
      if (!nextVersion) {
        nextVersion = '0.1.0';
      }
      const firmwareBuild = await prisma.firmwareBuilds.create({
        data: {
          url: data.url,
          repository: {
            connect: {
              id: data.repositoryId,
            }
          },
          version: parseFloat(nextVersion),
          status: 'BUILDING',
        }
      });
      res.status(201).json(firmwareBuild);
    } catch (error) {
      console.error('Error creating firmware build:', error);
      res.status(400).json({ error: 'Invalid firmware build data' });
    }
  },

  async getFirmwareBuilds(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const firmwareBuilds = await prisma.firmwareBuilds.findMany({
        where: {
          repository: {
            userId: user.id
          }
        },
        include: {
          repository: true
        }
      });
      res.json(firmwareBuilds);
    } catch (error) {
      console.error('Error fetching firmware builds:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getFirmwareBuildById(req: Request, res: Response) {

    try {
      const { id } = firmwareBuildSchema.id.parse(req.params);
      const firmwareBuild = await prisma.firmwareBuilds.findFirst({
        where: {
          repositoryId: id
        },
        include: {
          repository: true
        },
        orderBy: {
          version: 'desc'
        }
      });

      if (!firmwareBuild) {
        return res.status(404).json({ error: 'Firmware build not found' });
      }

      // // Check if the firmware build's repository belongs to the user
      // if (firmwareBuild.repository?.userId !== user.id) {
      //   return res.status(403).json({ error: 'Forbidden' });
      // }

      res.json(firmwareBuild);
    } catch (error) {
      console.error('Error fetching firmware build:', error);
      res.status(400).json({ error: 'Invalid firmware build ID' });
    }
  },

  async updateFirmwareBuild(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { id } = firmwareBuildSchema.id.parse(req.params);
      const data = firmwareBuildSchema.update.parse(req.body);

      const existingBuild = await prisma.firmwareBuilds.findUnique({
        where: { id },
        include: { repository: true }
      });

      if (!existingBuild) {
        return res.status(404).json({ error: 'Firmware build not found' });
      }

      if (existingBuild.repository?.userId !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const firmwareBuild = await prisma.firmwareBuilds.update({
        where: { id },
        data
      });
      res.json(firmwareBuild);
    } catch (error) {
      console.error('Error updating firmware build:', error);
      res.status(400).json({ error: 'Invalid update data' });
    }
  },

  async deleteFirmwareBuild(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { id } = firmwareBuildSchema.id.parse(req.params);

      const existingBuild = await prisma.firmwareBuilds.findUnique({
        where: { id },
        include: { repository: true }
      });

      if (!existingBuild) {
        return res.status(404).json({ error: 'Firmware build not found' });
      }

      if (existingBuild.repository?.userId !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await prisma.firmwareBuilds.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting firmware build:', error);
      res.status(400).json({ error: 'Invalid firmware build ID' });
    }
  }
};