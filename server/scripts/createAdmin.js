import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
