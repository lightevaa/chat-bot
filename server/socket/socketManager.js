// server/socket/socketManager.js
import AgentSupportChat from '../models/AgentSupportChat.js';

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join personal and role-based rooms
    socket.on('join', ({ userId, role }) => {
      socket.join(userId);
      console.log(`🟢 ${role} ${userId} joined their room`);

      if (role === 'admin') {
        socket.join('admins');
      } else if (role === 'agent') {
        socket.join('agents');
      }
    });

    // 📨 User sends message to agent
    socket.on('user_to_agent', async ({ from, message }) => {
      console.log(`📨 User ${from} → Agent`);
      io.to('agents').emit('support_request', { from, message });

      try {
        let chat = await AgentSupportChat.findOne({ userId: from });
        if (!chat) {
          chat = new AgentSupportChat({
            userId: from,
            messages: [],
            resolved: false
          });
        }

        chat.messages.push({
          senderId: from,
          receiverId: null, // Receiver is agent, but we leave it as null initially
          message,
          timestamp: new Date()
        });

        await chat.save();
      } catch (err) {
        console.error('❌ Error saving user message:', err);
      }
    });

    // 📩 Agent replies to user
    socket.on('agent_to_user', async ({ to, from, message }) => {
      console.log(`📩 Agent ${from} → User ${to}`);
      io.to(to).emit('agent_reply', { from, message });

      try {
        const chat = await AgentSupportChat.findOne({ userId: to });
        if (chat) {
          chat.messages.push({
            senderId: from,
            receiverId: to,
            message,
            timestamp: new Date()
          });
          await chat.save();
        }
      } catch (err) {
        console.error('❌ Error saving agent message:', err);
      }
    });

    // 🗨️ Agent sends message to admin
    socket.on('agent_to_admin', ({ from, message }) => {
      console.log(`🗨️ Agent ${from} → Admin`);
      io.to('admins').emit('admin_support_request', { from, message });
    });

    // 🛠 Admin replies to agent
    socket.on('admin_to_agent', ({ to, message }) => {
      console.log(`🛠 Admin → Agent ${to}`);
      io.to(to).emit('admin_reply', { from: 'admin', message });
    });

    // 📬 Admin sends message to user
    socket.on('admin_to_user', async ({ to, from, message }) => {
      console.log(`📬 Admin ${from} → User ${to}`);

      try {
        const chat = await AgentSupportChat.findOne({ userId: to });
        if (chat) {
          chat.messages.push({
            senderId: from,
            receiverId: to,
            message,
            timestamp: new Date()
          });
          await chat.save();
        }
      } catch (err) {
        console.error('❌ Error saving admin message:', err);
      }

      io.to(to).emit('admin_new_message', { from, message });
      io.to('admins').emit('admin_new_message', { from, message, to });
    });

    // 🔄 Fallback admin_new_message handler (manual trigger)
    socket.on('admin_new_message', async (data) => {
      const { userId, senderId, receiverId, message } = data;

      if (!userId || !senderId || !receiverId) {
        console.error('❌ Missing fields in admin_new_message event');
        return;
      }

      try {
        let chat = await AgentSupportChat.findOne({ userId });

        if (!chat) {
          chat = new AgentSupportChat({
            userId,
            messages: [],
            resolved: false
          });
        }

        chat.messages.push({
          senderId,
          receiverId,
          message,
          timestamp: new Date()
        });

        await chat.save();
      } catch (err) {
        console.error('❌ Error saving admin_new_message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

export default setupSocket;
