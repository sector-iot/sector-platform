import { Router } from "express";
import {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addDeviceToGroup,
  removeDeviceFromGroup,
  linkRepositoryToGroup,
  unlinkRepositoryFromGroup,
} from "../controllers/groupController";
import { authMiddleware } from "../middleware/auth-middleware";

const router = Router();

// Group CRUD routes
router.post("/", authMiddleware, createGroup);
router.get("/", authMiddleware, getGroups);
router.get("/:id", authMiddleware, getGroup);
router.put("/:id", authMiddleware, updateGroup);
router.delete("/:id", authMiddleware, deleteGroup);

// Device management routes
router.post("/:groupId/devices/:deviceId", authMiddleware, addDeviceToGroup);
router.delete(
  "/:groupId/devices/:deviceId",
  authMiddleware,
  removeDeviceFromGroup
);

// Repository management routes
router.post(
  "/:groupId/repositories/:repositoryId",
  authMiddleware,
  linkRepositoryToGroup
);
router.delete(
  "/:groupId/repositories/:repositoryId",
  authMiddleware,
  unlinkRepositoryFromGroup
);

export default router;
