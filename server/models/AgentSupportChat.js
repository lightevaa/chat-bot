// server/models/AgentSupportChat.js
import mongoose from 'mongoose';

// Define the message schema
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Define the support chat schema
const supportChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional until assigned
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false }
});

// Create the model based on the schema
const AgentSupportChat = mongoose.model('AgentSupportChat', supportChatSchema);

// Export the model
export default AgentSupportChat;
