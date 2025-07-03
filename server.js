import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './server/routes/auth.js';
import chatRoutes from './server/routes/chat.js';
import adminRoutes from './server/routes/admin.js';
import setupSocket from './server/socket/socketManager.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5000','http://localhost:3000'],
    methods: ['GET', 'POST'],
  }
});

// Setup socket.io globally for routes
app.set('io', io);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Production setup
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  app.get('*', (req, res) => res.sendFile(join(__dirname, 'dist/index.html')));
} else {
  app.get('/', (req, res) => res.send('Chatbot server running in development mode.'));
}

// Setup socket.io
setupSocket(io);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
