import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';
import config from './config/config';
import connectDB from './database/connection';
import apiRoutes from './routes/api.route';
import { processRecurringTasks } from './controllers/taskController';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Create a typed middleware
const morganMiddleware = morgan('dev');

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests
app.use(morganMiddleware); // Request logging

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Schedule recurring tasks processing
// Run every hour
cron.schedule('0 * * * *', () => {
  console.log('Processing recurring tasks...');
  processRecurringTasks();
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;