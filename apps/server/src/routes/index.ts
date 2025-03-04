import express from 'express';
import deviceRouter from "./deviceRoutes"

const router = express.Router();

router.get('/hello', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Hello, World!' });
});

router.use('/devices', deviceRouter)

export { router };