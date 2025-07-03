import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import agentRoutes from './routes/agent.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  app.use(express.static(join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
