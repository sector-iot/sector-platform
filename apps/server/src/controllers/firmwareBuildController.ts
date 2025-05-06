import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { z } from "zod";
import { mqttClient } from "../lib/mqtt-client";

// Validation schemas
const firmwareBuildSchema = {
  create: z.object({
    url: z.string().url("Must be a valid URL").optional(),
    repositoryId: z.string().min(1, "Repository ID is required"),
    groupId: z.string().min(1, "Group ID is required").optional(),
    version: z
      .string()
      .regex(
        /^\d+\.\d+\.\d+$/,
        "Version must follow semver format (MAJOR.MINOR.PATCH)"
      )
      .optional(),
      status: z.enum(["BUILDING", "SUCCESS", "FAILED"]).optional(),
  }),
  update: z.object({
    url: z.string().url("Must be a valid URL").optional(),
    status: z.enum(["BUILDING", "SUCCESS", "FAILED"]).optional(),
  }),
  id: z.object({
    id: z.string().min(1, "Id is required"),
  }),
};

// Helper function to handle version formatting
function getVersionNumber(versionString: string): number {
  // Simply replace dots and convert to number for storage
  return parseFloat(versionString.replace(/\./g, ""));
}

// Helper function to format database version to semantic version
function getVersionString(versionNum: number): string {
  // Convert numeric version to semantic version string format
  const versionStr = versionNum.toString();
  // Handle single digit versions (padding not needed for them)
  if (versionStr.length === 1) return `${versionStr}.0.0`;
  if (versionStr.length === 2) return `${versionStr[0]}.${versionStr[1]}.0`;
  
  // For 3 digits or more
  const major = versionStr[0];
  const minor = versionStr[1];
  const patch = versionStr.substring(2);
  return `${major}.${minor}.${patch}`;
}

export const firmwareBuildController = {
  async createFirmwareBuild(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const data = firmwareBuildSchema.create.parse(req.body);

      // Verify repository exists and belongs to user
      const repository = await prisma.repository.findUnique({
        where: {
          id: data.repositoryId,
          userId: user.id,
        },
        include: {
          groups: true,
        },
      });

      console.log("Repository groups:", repository?.groups);

      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }

      // If groupId is provided, verify it exists and belongs to user
      if (data.groupId) {
        const group = await prisma.group.findUnique({
          where: {
            id: data.groupId,
            userId: user.id,
          },
        });

        if (!group) {
          return res.status(404).json({ error: "Group not found" });
        }
      }

      let nextVersion;
      // If version is provided in the request, use it (e.g. from GitHub Actions)
      if (data.version) {
        // Version format is already validated by schema
        nextVersion = data.version;
      } else {
        // Find the latest version for this repository
        const latestBuild = await prisma.firmwareBuilds.findFirst({
          where: { repositoryId: data.repositoryId },
          orderBy: { version: "desc" },
        });

        // If no previous build exists, start with 0.1.0
        if (!latestBuild) {
          nextVersion = "0.1.0";
        } else {
          // Get the string representation of the version number
          const versionStr = getVersionString(latestBuild.version);
          // Parse the latest version
          const [major, minor, patch] = versionStr.split(".").map(Number);
          // Increment patch version
          nextVersion = `${major}.${minor}.${patch + 1}`;
        }
      }

      if (!nextVersion) {
        nextVersion = "0.1.0";
      }

      const firmwareBuild = await prisma.firmwareBuilds.create({
        data: {
          url: data.url,
          repository: {
            connect: {
              id: data.repositoryId,
            },
          },
          group: {
            connect: {
              id: repository.groups[0]?.groupId,
            }
          },
          version: getVersionNumber(nextVersion),
          status: data.status || "BUILDING",
        },
      });

      // Add version string for API response
      const responseData = {
        ...firmwareBuild,
        versionString: nextVersion
      };

      // Publish the new firmware build event to MQTT
      try {
        await mqttClient.publishFirmwareUpdate(firmwareBuild);
      } catch (mqttError) {
        console.error("Error publishing MQTT message:", mqttError);
        // Don't fail the request if MQTT publishing fails
      }

      res.status(201).json(responseData);
    } catch (error) {
      console.error("Error creating firmware build:", error);
      res.status(400).json({ error: "Invalid firmware build data" });
    }
  },

  async getFirmwareBuilds(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const firmwareBuilds = await prisma.firmwareBuilds.findMany({
        where: {
          repository: {
            userId: user.id,
          },
        },
        include: {
          repository: true,
          group: true,
        },
      });

      // Add version strings to each build
      const buildsWithVersionStrings = firmwareBuilds.map(build => ({
        ...build,
        versionString: getVersionString(build.version)
      }));
      
      res.json(buildsWithVersionStrings);
    } catch (error) {
      console.error("Error fetching firmware builds:", error);
      res.status(500).json({ error: "Server error" });
    }
  },

  async getFirmwareBuildById(req: Request, res: Response) {
    try {
      const { id } = firmwareBuildSchema.id.parse(req.params);
      const firmwareBuild = await prisma.firmwareBuilds.findFirst({
        where: {
          repositoryId: id,
        },
        include: {
          repository: true,
          group: true,
        },
        orderBy: {
          version: "desc",
        },
      });

      if (!firmwareBuild) {
        return res.status(404).json({ error: "Firmware build not found" });
      }

      // Add version string for response
      const responseData = {
        ...firmwareBuild,
        versionString: getVersionString(firmwareBuild.version)
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error fetching firmware build:", error);
      res.status(400).json({ error: "Invalid firmware build ID" });
    }
  },

  async getFirmwareForDevice(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;

      // Find the device and its groups
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: {
          groups: {
            include: {
              group: true,
            },
          },
        },
      });

      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }

      // Get all group IDs the device belongs to
      const groupIds = device.groups.map((gd) => gd.groupId);
      console.log("Group IDs:", groupIds);


      // Find the latest firmware build for the device's repository or any of its groups
      const firmwareBuild = await prisma.firmwareBuilds.findFirst({
        where: {
          status: "SUCCESS",
          OR: [
            {
              groupId: {
                in: groupIds,
              }
            },
            {
              repositoryId: device.repositoryId ?? undefined,
            }
          ]
        },
        include: {
          repository: true,
          group: true,
        },
        orderBy: {
          version: "desc",
        },
      });

      if (!firmwareBuild) {
        return res.status(404).json({ error: "No firmware build found" });
      }

      // Add version string for response
      const responseData = {
        ...firmwareBuild,
        versionString: getVersionString(firmwareBuild.version)
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error fetching firmware for device:", error);
      res.status(500).json({ error: "Server error" });
    }
  },

  async updateFirmwareBuild(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { id } = firmwareBuildSchema.id.parse(req.params);
      const data = firmwareBuildSchema.update.parse(req.body);

      const existingBuild = await prisma.firmwareBuilds.findUnique({
        where: { id },
        include: { repository: true },
      });

      if (!existingBuild) {
        return res.status(404).json({ error: "Firmware build not found" });
      }

      if (existingBuild.repository?.userId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const firmwareBuild = await prisma.firmwareBuilds.update({
        where: { id },
        data,
        include: {
          repository: true,
          group: true,
        },
      });

      // If status is updated to SUCCESS, publish the firmware update event
      if (data.status === "SUCCESS") {
        try {
          await mqttClient.publishFirmwareUpdate(firmwareBuild);
        } catch (mqttError) {
          console.error("Error publishing MQTT message:", mqttError);
          // Don't fail the request if MQTT publishing fails
        }
      }

      // Add version string for response
      const responseData = {
        ...firmwareBuild,
        versionString: getVersionString(firmwareBuild.version)
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error updating firmware build:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  },

  async deleteFirmwareBuild(req: Request, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { id } = firmwareBuildSchema.id.parse(req.params);

      const existingBuild = await prisma.firmwareBuilds.findUnique({
        where: { id },
        include: { repository: true },
      });

      if (!existingBuild) {
        return res.status(404).json({ error: "Firmware build not found" });
      }

      if (existingBuild.repository?.userId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await prisma.firmwareBuilds.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting firmware build:", error);
      res.status(400).json({ error: "Invalid firmware build ID" });
    }
  },
};
