# 💬 Chatbot Application

A full-stack AI-powered chatbot application with real-time messaging and role-based access control, designed for seamless communication between users, agents, and administrators.

---

## 🚀 Tech Stack

- **Frontend**: React.js, TailwindCSS  
- **Backend**: Node.js, Express.js  
- **Real-Time Communication**: Socket.IO  
- **Database**: MongoDB  
- **AI Integration**: OpenAI GPT API  
- **Authentication**: JWT-based secure login

---

## ✨ Key Features

✅ **Role-Based Access Control**  
- Distinct roles: **Admin**, **Agent**, **User**  
- Customized access and dashboard for each user type

💬 **Real-Time Messaging**  
- Socket.IO-based live chat  
- Typing indicators for a smooth user experience  
- Seamless communication between users and agents

🤖 **AI-Powered Responses**  
- Integrated with OpenAI GPT for smart auto-replies  
- Auto-resolution of common queries using natural language processing

🗂️ **Persistent Chat History**  
- MongoDB for storing conversation logs  
- Access past conversations and analyze chat context

🧑‍💼 **Live Agent Escalation**  
- Automatically detects unresolved queries  
- Transfers conversation from chatbot to human agent in real-time

🔐 **Secure Authentication**  
- JWT-based login system  
- Session management with role verification

---

## 📸 Screenshots

> _Add UI screenshots or a demo GIF here if available_

---

## 📁 Project Structure

```bash
chatbot-app/
├── client/           # React frontend
├── server/           # Node.js backend (Express + Socket.IO)
├── models/           # Mongoose schemas for users, messages, roles
├── routes/           # Express routes (auth, chat, user)
└── .env              # API keys and environment variables
```

---

## 🛠️ Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-username/chatbot-app.git
cd chatbot-app
```

2. **Setup the backend**
```bash
cd server
npm install
npm run dev
```

3. **Setup the frontend**
```bash
cd ../client
npm install
npm start
```

4. **Environment Variables**
```env
# .env (server)
MONGODB_URI=your_mongo_uri
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_key
```

---
