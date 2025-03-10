import { Router } from 'express';
import { repositoryController } from '../controllers/repositoryController';

const router = Router();

// Create a new repository
router.post('/', repositoryController.createRepository);

// Get all repositories
router.get('/', repositoryController.getAllRepositories);

// Get repository by ID
router.get('/:id', repositoryController.getRepositoryById);

// Update repository
router.put('/:id', repositoryController.updateRepository);

// Delete repository
router.delete('/:id', repositoryController.deleteRepository);

// Link device to repository
router.post('/link-device', repositoryController.linkDeviceToRepository);

// Unlink device from repository
router.delete('/unlink-device/:deviceId', repositoryController.unlinkDeviceFromRepository);

export default router;