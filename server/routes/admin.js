import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

const router = express.Router();

// Middleware to check admin access
router.use(authenticate, isAdmin);

// @route PUT /api/admin/user/:id/role
// @desc Update user role (assign/remove agent)
// @access Admin
router.put('/user/:id/role', async (req, res) => {
  const { role } = req.body;

  // Validate if role is either 'user' or 'agent'
  if (!['user', 'agent'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role update' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If the role is the same, do not proceed with update
    if (user.role === role) {
      return res.status(400).json({ message: 'User is already assigned this role' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'Role updated successfully', user });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/admin/users
// @desc Get all users
// @access Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/admin/conversations
// @desc Get all conversations
// @access Admin
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error('Admin get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/admin/conversation/:id
// @desc Get a specific conversation
// @access Admin
router.get('/conversation/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('userId', 'name email');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Admin get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/admin/stats
// @desc Get admin dashboard stats
// @access Admin
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalConversations = await Conversation.countDocuments();

    // Get counts by use case
    const useCaseCounts = await Conversation.aggregate([
      { $group: { _id: '$useCase', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent user registrations
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      userStats: {
        totalUsers,
        totalAdmins
      },
      conversationStats: {
        total: totalConversations,
        byUseCase: useCaseCounts
      },
      recentUsers
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get all messages between admin and a user
router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const messages = await Message.find({
    $or: [
      { from: userId, to: 'admin' },
      { from: 'admin', to: userId }
    ]
  }).sort({ timestamp: 1 });

  res.json(messages);
});

export default router;
