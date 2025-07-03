import { io } from "socket.io-client";

let socket;
let isInitialized = false; // Prevent multiple initializations

// Utility: Timestamped logging
const logWithTime = (msg) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
};

export const connectSocket = (userId, role) => {
  if (!socket || !isInitialized) {
    const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:5000";  // Make sure this is correct

    console.log(`Attempting to connect to socket server at: ${socketServerUrl}`);

    socket = io(socketServerUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      logWithTime("✅ Socket connected: " + socket.id);
      socket.emit("join", { userId, role });
      isInitialized = true;
    });

    socket.on("connect_error", (error) => {
      logWithTime(`❌ Socket connection error: ${error.message}`);
    });

    socket.on("connect_timeout", () => {
      logWithTime("⚠️ Socket connection timed out");
    });

    socket.on("disconnect", () => {
      logWithTime("❌ Socket disconnected");
      isInitialized = false;
    });

    socket.io.on("reconnect", (attempt) => {
      logWithTime(`🔁 Reconnected after ${attempt} attempt(s)`);
      socket.emit("join", { userId, role });
    });
  } else {
    logWithTime("ℹ️ Socket already initialized: " + (socket.connected ? "Connected" : "Not connected"));
  }
};

// Utility: Check if socket is connected
export const isSocketConnected = () => {
  if (socket) {
    logWithTime(`🔍 Socket connected: ${socket.connected}`);
    return socket.connected;
  } else {
    logWithTime("⚠️ Socket not initialized");
    return false;
  }
};

// Export socket instance
export const getSocket = () => socket;

// Utility: Wait for socket to be connected before emitting
const emitIfConnected = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
    logWithTime(`Emitted event: ${event}`);
  } else {
    logWithTime("⚠️ Socket not connected. Retrying in 1 second...");
    setTimeout(() => emitIfConnected(event, data), 1000); // Retry after 1 second
  }
};

// Emitters
export const sendUserMessageToAgent = ({ from, message }) => {
  if (isSocketConnected()) {
    emitIfConnected("user_to_agent", { from, message });
  } else {
    console.log("⚠️ Socket not connected. Retrying message...");
    setTimeout(() => sendUserMessageToAgent({ from, message }), 1000);
  }
};

export const sendAgentReplyToUser = ({ to, from, message }) => {
  if (isSocketConnected()) {
    emitIfConnected("agent_to_user", { to, from, message });
  } else {
    console.log("⚠️ Socket not connected. Retrying message...");
    setTimeout(() => sendAgentReplyToUser({ to, from, message }), 1000);
  }
};

export const sendAgentMessageToAdmin = ({ from, message }) => {
  if (isSocketConnected()) {
    emitIfConnected("agent_to_admin", { from, message });
  } else {
    console.log("⚠️ Socket not connected. Retrying message...");
    setTimeout(() => sendAgentMessageToAdmin({ from, message }), 1000);
  }
};

export const sendAdminReplyToAgent = ({ to, message }) => {
  if (isSocketConnected()) {
    emitIfConnected("admin_to_agent", { to, message });
  } else {
    console.log("⚠️ Socket not connected. Retrying message...");
    setTimeout(() => sendAdminReplyToAgent({ to, message }), 1000);
  }
};

export const sendAdminMessageToUser = ({ to, from, message }) => {
  if (isSocketConnected()) {
    emitIfConnected('admin_to_user', { to, from, message });
  } else {
    console.log("⚠️ Socket not connected. Retrying message...");
    setTimeout(() => sendAdminMessageToUser({ to, from, message }), 1000);
  }
};
