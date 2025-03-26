import express from 'express';
import deviceRouter from "./deviceRoutes"
import repositoryRouter from "./repositoryRoutes"
import { authMiddleware } from '../middleware/auth-middleware';
import firmwareBuildRouter  from './firmwareBuildRoutes';


const router = express.Router();

router.get('/hello', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Hello, World!' });
});

router.use('/devices', authMiddleware, deviceRouter);
router.use('/repositories', authMiddleware, repositoryRouter);
router.use('/firmware', firmwareBuildRouter);

export { router };