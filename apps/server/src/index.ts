import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { toNodeHandler } from "better-auth/node";
import { router as apiRouter } from './routes/hello';
import { auth } from './lib/auth';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json());

// Routes
app.use('/api', apiRouter);
// Root route
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Welcome to the API!' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});