import express from 'express';

const router = express.Router();

router.get('/hello', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Hello, World!' });
});

export { router };