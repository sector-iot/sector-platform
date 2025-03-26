import { Router } from 'express';
import { firmwareBuildController } from '../controllers/firmwareBuildController';


const router = Router();


// CRUD routes for firmware builds
router.post('/', firmwareBuildController.createFirmwareBuild);
router.get('/', firmwareBuildController.getFirmwareBuilds);
router.get('/:id', firmwareBuildController.getFirmwareBuildById);
router.put('/:id', firmwareBuildController.updateFirmwareBuild);
router.delete('/:id', firmwareBuildController.deleteFirmwareBuild);

export default router;