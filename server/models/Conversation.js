import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  path: String, // Path relative to the server uploads directory
  size: Number,
});

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'agent', 'admin'], // extended to support roles
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [attachmentSchema],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // allow anonymous sessions
  },
  userEmail: {
    type: String,
    default: 'anonymous'
  },
  useCase: {
    type: String,
    enum: ['Default', 'Healthcare', 'Banking', 'Education', 'E-commerce', 'Lead Generation'],
    default: 'Default'
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to always update updatedAt
conversationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
