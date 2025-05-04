import { Router } from "express";
import { firmwareBuildController } from "../controllers/firmwareBuildController";
import { authMiddleware } from "../middleware/auth-middleware";

const router = Router();

router.use(authMiddleware);

// CRUD routes for firmware builds
router.post("/", firmwareBuildController.createFirmwareBuild);
router.get("/", firmwareBuildController.getFirmwareBuilds);
router.get("/:id", firmwareBuildController.getFirmwareBuildById);
router.get("/device/:deviceId", firmwareBuildController.getFirmwareForDevice);
router.put("/:id", firmwareBuildController.updateFirmwareBuild);
router.delete("/:id", firmwareBuildController.deleteFirmwareBuild);

export default router;
