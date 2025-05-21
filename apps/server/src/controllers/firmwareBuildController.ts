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
          // Get the actual version number (stored as float in DB)
          const latestVersion = latestBuild.version;

          // Parse into semver parts - we'll simply calculate a new patch version
          // Use 0 as fallback values
          const major = Math.floor(latestVersion);
          const minor = Math.floor((latestVersion * 10) % 10);
          const patch = Math.floor((latestVersion * 100) % 10);

          // Increment patch version
          nextVersion = `${major}.${minor}.${patch + 1}`;
        }
      }

      if (!nextVersion) {
        nextVersion = "0.1.0";
      }

      // Convert version string to float for storage
      // For example, "3.0.0" becomes 3.0
      const versionAsFloat = parseFloat(nextVersion.replace(/\.(\d+)$/, ""));

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
              id: repository.groups[0]?.id,
            },
          },
          version: versionAsFloat,
          status: data.status || "BUILDING",
        },
      });

      // Format the response to include the original version string
      const responseData = {
        ...firmwareBuild,
        version: nextVersion, // Override with the semantic version string
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

      // Format version numbers for response
      const formattedBuilds = firmwareBuilds.map((build) => {
        // Convert float version to semantic version string
        const major = Math.floor(build.version);
        const minor = Math.floor((build.version * 10) % 10);
        const patch = Math.floor((build.version * 100) % 10);
        const versionString = `${major}.${minor}.${patch}`;

        return {
          ...build,
          version: versionString, // Replace the numeric version with the formatted string
        };
      });

      res.json(formattedBuilds);
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

      // Format version number for response
      const major = Math.floor(firmwareBuild.version);
      const minor = Math.floor((firmwareBuild.version * 10) % 10);
      const patch = Math.floor((firmwareBuild.version * 100) % 10);
      const versionString = `${major}.${minor}.${patch}`;

      const responseData = {
        ...firmwareBuild,
        version: versionString, // Replace the numeric version with the formatted string
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

      // Find the device and its group
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: {
          group: true,
        },
      });

      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }

      // Get the device's group ID if it exists
      const groupId = device.group?.id;

      // Find the latest firmware build for the device's repository or its group
      const firmwareBuild = await prisma.firmwareBuilds.findFirst({
        where: {
          status: "SUCCESS",
          OR: [
            {
              groupId: groupId ?? undefined,
            },
            {
              repositoryId: device.repositoryId ?? undefined,
            },
          ],
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

      // Format version number for response
      const major = Math.floor(firmwareBuild.version);
      const minor = Math.floor((firmwareBuild.version * 10) % 10);
      const patch = Math.floor((firmwareBuild.version * 100) % 10);
      const versionString = `${major}.${minor}.${patch}`;

      const responseData = {
        ...firmwareBuild,
        version: versionString, // Replace the numeric version with the formatted string
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

      // Format version number for response
      const major = Math.floor(firmwareBuild.version);
      const minor = Math.floor((firmwareBuild.version * 10) % 10);
      const patch = Math.floor((firmwareBuild.version * 100) % 10);
      const versionString = `${major}.${minor}.${patch}`;

      const responseData = {
        ...firmwareBuild,
        version: versionString, // Replace the numeric version with the formatted string
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
