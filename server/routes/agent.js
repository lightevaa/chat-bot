import express from 'express';
import User from '../models/User.js';
import AgentSupportChat from '../models/AgentSupportChat.js';

const router = express.Router();

// Fetch all users for agent view
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

// Fetch chat history with one user
router.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query; // Default to page 1 and 20 messages per page

  try {
    // Pagination calculation
    const skip = (page - 1) * limit;

    const messages = await AgentSupportChat.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit)) // Limit number of messages fetched
      .populate('senderId', 'name email')  // Populate sender details
      .populate('receiverId', 'name email');  // Populate receiver details

    // If no messages found
    if (!messages.length) {
      return res.status(404).json({ message: 'No messages found for this user.' });
    }

    res.json(messages);
  } catch (err) {
    console.error('Failed to fetch messages:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch messages' });
  }
});

export default router;
