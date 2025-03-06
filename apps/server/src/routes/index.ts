import express from 'express';
import deviceRouter from "./deviceRoutes"
import { authMiddleware } from '../middleware/auth-middleware';


const router = express.Router();

router.get('/hello', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Hello, World!' });
});

router.use('/devices', authMiddleware, deviceRouter)

export { router };