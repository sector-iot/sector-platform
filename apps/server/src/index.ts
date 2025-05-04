import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { toNodeHandler } from "better-auth/node";
import { router as apiRouter } from './routes';
import { auth } from './lib/auth';
import { mqttClient } from './lib/mqtt-client';

// Load environment variables
dotenv.config();

// Initialize MQTT client
console.log('Initializing MQTT client...');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json());

// Routes
app.use('/api', apiRouter);

// Root route to provide API rundown
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'Welcome to the API!',
    description: 'This API allows you to manage devices and user authentication.',
    availableEndpoints: [
      {
        method: 'GET',
        endpoint: '/api/devices',
        description: 'Fetch all devices',
      },
      {
        method: 'GET',
        endpoint: '/api/devices/:id',
        description: 'Fetch a single device by ID',
      },
      {
        method: 'POST',
        endpoint: '/api/devices',
        description: 'Create a new device',
      },
      {
        method: 'PUT',
        endpoint: '/api/devices/:id',
        description: 'Update an existing device',
      },
      {
        method: 'DELETE',
        endpoint: '/api/devices/:id',
        description: 'Delete a device by ID',
      },
      {
        method: 'POST',
        endpoint: '/api/auth/login',
        description: 'User login endpoint',
      },
      {
        method: 'POST',
        endpoint: '/api/auth/register',
        description: 'User registration endpoint',
      }
    ],
    note: 'For more detailed information, please refer to the API documentation or the README file.',
  });
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
