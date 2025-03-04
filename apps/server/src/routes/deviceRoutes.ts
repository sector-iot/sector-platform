import { Router } from 'express';
import { deviceController } from '../controllers/deviceController';

const router = Router();

// Create a new device
router.post('/', deviceController.createDevice);

// Get all devices
router.get('/', deviceController.getAllDevices);

// Get device by ID
router.get('/:id', deviceController.getDeviceById);

// Update device
router.put('/:id', deviceController.updateDevice);

// Delete device
router.delete('/:id', deviceController.deleteDevice);

export default router;