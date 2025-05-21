import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description } = createGroupSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        userId,
      },
    });

    return res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(400).json({ error: "Invalid input" });
  }
};

export const getGroups = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const groups = await prisma.group.findMany({
      where: {
        userId,
      },
      include: {
        devices: true,
        repository: true,
      },
    });

    return res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const group = await prisma.group.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        devices: true,
        repository: true,
      },
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = updateGroupSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const group = await prisma.group.update({
      where: {
        id,
        userId,
      },
      data: {
        name,
        description,
      },
    });

    return res.json(group);
  } catch (error) {
    console.error("Error updating group:", error);
    return res.status(400).json({ error: "Invalid input" });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await prisma.group.delete({
      where: {
        id,
        userId,
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting group:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const addDeviceToGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, deviceId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify group and device belong to user
    const [group, device] = await Promise.all([
      prisma.group.findFirst({
        where: {
          id: groupId,
          userId,
        },
      }),
      prisma.device.findFirst({
        where: {
          id: deviceId,
          userId,
        },
      }),
    ]);

    if (!group || !device) {
      return res.status(404).json({ error: "Group or device not found" });
    }

    // Update the device to be in the group
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        group: {
          connect: { id: groupId },
        },
      },
      include: {
        group: true,
      },
    });

    return res.status(200).json(updatedDevice);
  } catch (error) {
    console.error("Error adding device to group:", error);
    return res.status(400).json({ error: "Invalid input" });
  }
};

export const removeDeviceFromGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, deviceId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify group belongs to user
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        userId,
      },
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Update the device to remove it from the group
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        group: {
          disconnect: true,
        },
      },
      include: {
        group: true,
      },
    });

    return res.status(200).json(updatedDevice);
  } catch (error) {
    console.error("Error removing device from group:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const linkRepositoryToGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, repositoryId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify group and repository belong to user
    const [group, repository] = await Promise.all([
      prisma.group.findFirst({
        where: {
          id: groupId,
          userId,
        },
      }),
      prisma.repository.findFirst({
        where: {
          id: repositoryId,
          userId,
        },
      }),
    ]);

    if (!group || !repository) {
      return res.status(404).json({ error: "Group or repository not found" });
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        repository: {
          connect: { id: repositoryId },
        },
      },
      include: {
        devices: true,
        repository: true,
      },
    });

    return res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error linking repository to group:", error);
    return res.status(400).json({ error: "Invalid input" });
  }
};

export const unlinkRepositoryFromGroup = async (
  req: Request,
  res: Response
) => {
  try {
    const { groupId, repositoryId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify group belongs to user
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        userId,
      },
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        repository: {
          disconnect: true,
        },
      },
      include: {
        devices: true,
        repository: true,
      },
    });

    return res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error unlinking repository from group:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
