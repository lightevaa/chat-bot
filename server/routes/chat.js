import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import getAIResponse from '../utils/aiApi.js';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
const router = express.Router();

// --- Paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const uploadDir = path.join(projectRoot, 'uploads');
const tempUnzipDir = path.join(uploadDir, 'temp_unzip');

fs.mkdir(tempUnzipDir, { recursive: true }).catch(console.error);

// --- Multer Config ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'attachment-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const allowedTypes = /pdf|docx|jpg|jpeg|png|gif|js|jsx|ts|tsx|py|java|c|cpp|html|css|json|md|zip/;
const fileFilter = (req, file, cb) => {
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase()) || file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed';
    if (file.mimetype === 'application/octet-stream' && path.extname(file.originalname).toLowerCase() === '.zip') {
        return cb(null, true);
    }
    if (mimetype || extname) { return cb(null, true); }
    console.warn(`File type rejected: ${file.originalname}, mimetype: ${file.mimetype}, ext: ${path.extname(file.originalname)}`);
    cb(new Error('Error: File type not allowed! Allowed: ' + allowedTypes), false);
};
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: fileFilter });

// --- Helpers ---
const textFileExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.html', '.css', '.json'];

async function getZipInfo(zipFilePath) {
    console.log(`[getZipInfo] Processing zip file: ${zipFilePath}`);
    const zip = new AdmZip(zipFilePath);
    const structure = [];
    const textFileContents = {};
    zip.getEntries().forEach(entry => {
        const entryPath = entry.entryName;
        if (entry.isDirectory) {
            structure.push({ type: 'dir', path: entryPath });
        } else {
            structure.push({ type: 'file', path: entryPath });
            const ext = path.extname(entryPath).toLowerCase();
            if (textFileExtensions.includes(ext)) {
                try {
                    const content = zip.readAsText(entry);
                    textFileContents[entryPath] = content;
                } catch (err) {
                    console.error(`[getZipInfo] Error reading ${entryPath}:`, err);
                    textFileContents[entryPath] = '[Error reading file content]';
                }
            }
        }
    });
    return { structure, textFileContents };
}

function formatZipInfo(zipInfo) {
    let output = 'Zip file structure:\n';
    zipInfo.structure.forEach(item => {
        const depth = item.path.split('/').length - 1;
        const indent = '  '.repeat(Math.max(0, depth));
        output += `${indent}${item.type === 'dir' ? '[Dir] ' : '- '}${path.basename(item.path)}\n`;
    });
    output += '\nContents of text files:\n';
    for (const [filePath, content] of Object.entries(zipInfo.textFileContents)) {
        output += `File: ${filePath}\n\`\`\`\n${content}\n\`\`\`\n\n`;
    }
    return output;
}

async function getTextFileContent(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return content;
    } catch (err) {
        console.error(`[getTextFileContent] Error reading ${filePath}:`, err);
        return '[Error reading file content]';
    }
}

async function getFileContentsContext(attachments) {
    let fileContentsContext = '';
    for (const attachment of attachments) {
        const absoluteFilePath = path.join(projectRoot, attachment.path);
        const ext = path.extname(attachment.originalname).toLowerCase();
        if (ext === '.zip') {
            const zipInfo = await getZipInfo(absoluteFilePath);
            const zipContext = formatZipInfo(zipInfo);
            fileContentsContext += `\n\nZip file: ${attachment.originalname}\n${zipContext}`;
        } else if (textFileExtensions.includes(ext)) {
            const content = await getTextFileContent(absoluteFilePath);
            fileContentsContext += `\n\nFile: ${attachment.originalname}\n\`\`\`\n${content}\n\`\`\``;
        } else {
            fileContentsContext += `\n\nFile: ${attachment.originalname} (non-text file)`;
        }
    }
    return fileContentsContext;
}

// --- POST /api/chat/send ---
router.post('/send', authenticate, upload.array('attachments', 5), async (req, res) => {
  console.log("[POST /api/chat/send] Received request.");
  try {
    const { message = '', conversationId, useCase } = req.body;
    const files = req.files || [];
    const userId = req.user?._id;

    console.log(`[POST /api/chat/send] User: ${userId}, Files Received: ${files.length}`);
    files.forEach(f => console.log(`  - File: ${f.originalname} (${f.mimetype}), Path: ${f.path}`));

    if (!message.trim() && files.length === 0) {
       console.log("[POST /api/chat/send] Error: Empty message and no files.");
       return res.status(400).json({ message: 'Message content or file attachment is required' });
    }

    let conversation;
    if (conversationId) {
        console.log(`[POST /api/chat/send] Finding existing conversation: ${conversationId}`);
        conversation = await Conversation.findOne({ _id: conversationId, userId });
        if (!conversation) {
            console.log(`[POST /api/chat/send] Error: Conversation ${conversationId} not found for user ${userId}.`);
            return res.status(404).json({ message: 'Conversation not found' });
        }
        console.log(`[POST /api/chat/send] Found conversation.`);
    } else {
        console.log(`[POST /api/chat/send] Creating new conversation for user ${userId}, useCase: ${useCase || 'Default'}`);
        conversation = new Conversation({ userId, useCase: useCase || 'Default', messages: [] });
    }

    console.log(`[POST /api/chat/send] Preparing attachment data...`);
    const attachmentData = [];
    for (const file of files) {
        const relativePathForDbAndUrl = `uploads/${file.filename}`;
        attachmentData.push({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            path: relativePathForDbAndUrl,
            size: file.size,
        });
    }
    const fileContentsContext = await getFileContentsContext(attachmentData);
    console.log(`[POST /api/chat/send] Attachment data and file contents prepared.`);

    const userMessageContent = message || `Attached file(s): ${files.map(f => f.originalname).join(', ')}`;
    const newUserMessage = { role: 'user', content: userMessageContent, attachments: attachmentData, timestamp: new Date() };
    conversation.messages.push(newUserMessage);
    console.log(`[POST /api/chat/send] User message added to conversation object.`);

    console.log(`[POST /api/chat/send] Preparing AI context...`);
    let aiContextMessages = conversation.messages.map(m => ({
        role: m.role,
        content: m.content + (m.attachments && m.attachments.length > 0 ? ` [Attachments: ${m.attachments.map(a => a.originalname).join(', ')}]` : '')
    }));
    if (fileContentsContext) {
        aiContextMessages[aiContextMessages.length - 1].content += `\n\nThe following are the contents of the attached files:\n${fileContentsContext}`;
    }
    let modificationNote = "\n\n**Note:** I cannot directly modify uploaded project files. I can only analyze the structure and content provided and suggest changes or provide modified code snippets based on your requests.";
    aiContextMessages[aiContextMessages.length - 1].content += modificationNote;
    console.log(`[POST /api/chat/send] AI context prepared.`);

    console.log(`[POST /api/chat/send] Calling AI API...`);
    const aiResponse = await getAIResponse(aiContextMessages, conversation.useCase);
    console.log(`[POST /api/chat/send] Received AI response.`);

    if (!aiResponse || typeof aiResponse !== 'string') { throw new Error('AI response is invalid or empty'); }

    conversation.messages.push({ role: 'assistant', content: aiResponse, attachments: [], timestamp: new Date() });
    console.log(`[POST /api/chat/send] Assistant message added to conversation object.`);

    console.log(`[POST /api/chat/send] Saving conversation...`);
    await conversation.save();
    console.log(`[POST /api/chat/send] Conversation saved. ID: ${conversation._id}`);

    // Emit socket events for real-time updates
    const io = req.app.get('io');
    io.to(userId.toString()).emit('new_message', {
      conversationId: conversation._id,
      message: newUserMessage
    });

    io.to('admins').emit('admin_new_message', {
      userId: userId.toString(),
      conversationId: conversation._id,
      message: newUserMessage,
      useCase: conversation.useCase
    });

    return res.status(200).json({ message: aiResponse, conversationId: conversation._id });

  } catch (error) {
    console.error('[POST /api/chat/send] --- ERROR ---'); 
    console.error('Timestamp:', new Date().toISOString()); 
    console.error('Error Name:', error.name); 
    console.error('Error Message:', error.message); 
    if (error.code) console.error('Error Code:', error.code); 
    if (error.path) console.error('Error Path:', error.path); 
    console.error('Error Stack:', error.stack); 
    console.error('--- END ERROR ---');
    if (error instanceof multer.MulterError) { return res.status(400).json({ message: `File upload error: ${error.message}` }); }
    else if (error.message.includes('File type not allowed')) { return res.status(400).json({ message: 'Invalid file type uploaded.' }); }
    return res.status(500).json({ message: 'Internal server error occurred. Please check logs.', error: error.message });
  }
});

// --- GET /api/chat/conversations ---
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id }).select('_id useCase messages updatedAt').sort({ updatedAt: -1 });
    const summary = conversations.map(conv => { 
      const lastMessage = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null; 
      const lastMessageContent = lastMessage ? lastMessage.content : 'No messages yet'; 
      return { 
        _id: conv._id, 
        useCase: conv.useCase, 
        lastMessage: lastMessageContent.substring(0, 50) + (lastMessageContent.length > 50 ? '...' : ''), 
        updatedAt: conv.updatedAt, 
        messageCount: conv.messages.length 
      }; 
    });
    res.json(summary);
  } catch (error) { 
    console.error('Get conversations error:', error); 
    res.status(500).json({ message: 'Server error' }); 
  }
});

// --- GET /api/chat/conversation/:id ---
router.get('/conversation/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) { return res.status(400).json({ message: 'Invalid conversation ID format' }); }
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) { return res.status(404).json({ message: 'Conversation not found' }); }
    res.json(conversation);
  } catch (error) { 
    console.error('Get conversation error:', error); 
    res.status(500).json({ message: 'Server error' }); 
  }
});

// --- DELETE /api/chat/conversation/:id ---
router.delete('/conversation/:id', authenticate, async (req, res) => {
    try {
        const conversationId = req.params.id; 
        const userId = req.user._id;
        if (!mongoose.Types.ObjectId.isValid(conversationId)) { return res.status(400).json({ message: 'Invalid conversation ID format' }); }
        console.log(`[DELETE /api/chat/conversation/${conversationId}] User: ${userId} attempting delete.`);
        const result = await Conversation.deleteOne({ _id: conversationId, userId: userId });
        if (result.deletedCount === 0) { 
          console.log(`[DELETE /api/chat/conversation/${conversationId}] Conversation not found or user mismatch.`); 
          return res.status(404).json({ message: 'Conversation not found or access denied' }); 
        }
        console.log(`[DELETE /api/chat/conversation/${conversationId}] Conversation deleted successfully.`);
        res.status(200).json({ message: 'Conversation deleted successfully' });
    } catch (error) { 
      console.error(`[DELETE /api/chat/conversation/${req.params.id}] Error:`, error); 
      res.status(500).json({ message: 'Server error while deleting conversation' }); 
    }
});

// --- PUT /api/chat/conversation/:conversationId/message/:messageId ---
router.put('/conversation/:conversationId/message/:messageId', authenticate, async (req, res) => {
    try {
        const { conversationId, messageId } = req.params;
        const { newContent } = req.body;
        const userId = req.user._id;

        // Validation
        if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        if (!newContent || typeof newContent !== 'string' || newContent.trim() === '') {
            return res.status(400).json({ message: 'New message content is required' });
        }

        console.log(`[PUT /api/chat/.../edit/${messageId}] User: ${userId} attempting edit & regenerate.`);

        // Find the conversation
        const conversation = await Conversation.findOne({ _id: conversationId, userId: userId });
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found or access denied' });
        }

        // Find the index of the message to edit
        const messageIndex = conversation.messages.findIndex(msg => msg._id.equals(messageId));
        if (messageIndex === -1) {
            return res.status(404).json({ message: 'Message to edit not found' });
        }

        const originalMessage = conversation.messages[messageIndex];

        // Ensure it's a user message being edited
        if (originalMessage.role !== 'user') {
            return res.status(403).json({ message: 'Cannot edit AI responses' });
        }

        // Truncate the conversation history up to the message being edited
        const historyUpToEdit = conversation.messages.slice(0, messageIndex);

        // Create the updated user message object
        const editedUserMessage = {
            ...originalMessage.toObject(),
            _id: originalMessage._id,
            content: newContent.trim(),
            timestamp: originalMessage.timestamp,
        };

        // Add the edited message back
        const newMessagesHistory = [...historyUpToEdit, editedUserMessage];

        // Prepare context for AI
        console.log(`[PUT /api/chat/.../edit/${messageId}] Preparing AI context after edit...`);
        let aiContextMessages = newMessagesHistory.map(m => ({
            role: m.role,
            content: m.content + (m.attachments && m.attachments.length > 0 ? ` [Attachments: ${m.attachments.map(a => a.originalname).join(', ')}]` : '')
        }));

        // Include file contents for the edited message's attachments
        const editedMessageAttachments = editedUserMessage.attachments || [];
        if (editedMessageAttachments.length > 0) {
            const fileContentsContext = await getFileContentsContext(editedMessageAttachments);
            aiContextMessages[aiContextMessages.length - 1].content += `\n\nThe following are the contents of the attached files:\n${fileContentsContext}`;
        }

        // Add modification note
        aiContextMessages[aiContextMessages.length - 1].content += "\n\n**Note:** I cannot directly modify uploaded project files. I can only analyze the structure and content provided and suggest changes or provide modified code snippets based on your requests.";
        console.log(`[PUT /api/chat/.../edit/${messageId}] AI context prepared.`);

        // Call AI API
        console.log(`[PUT /api/chat/.../edit/${messageId}] Calling AI API for regenerated response...`);
        const aiResponse = await getAIResponse(aiContextMessages, conversation.useCase);
        console.log(`[PUT /api/chat/.../edit/${messageId}] Received regenerated AI response.`);

        if (!aiResponse || typeof aiResponse !== 'string') {
            throw new Error('AI response is invalid or empty after edit');
        }

        // Add the new AI response
        const newAssistantMessage = {
            role: 'assistant',
            content: aiResponse,
            attachments: [],
            timestamp: new Date()
        };
        newMessagesHistory.push(newAssistantMessage);

        // Update the conversation object
        conversation.messages = newMessagesHistory;
        conversation.updatedAt = new Date();

        // Save the conversation
        await conversation.save();

        // Real-time emit
        const io = req.app.get('io');
        io.to(userId.toString()).emit('new_message', {
          conversationId: conversation._id,
          message: editedUserMessage, // Use editedUserMessage instead of undefined newUserMessage
        });
        io.to('admins').emit('admin_new_message', {
          userId: userId.toString(),
          conversationId: conversation._id,
          message: editedUserMessage, // Use editedUserMessage instead of undefined newUserMessage
          useCase: conversation.useCase
        });

        // Return the updated conversation
        const updatedConversation = await Conversation.findOne({ _id: conversationId, userId: userId });
      
        res.status(200).json({
            message: 'Message updated and conversation regenerated',
            updatedConversation: updatedConversation
        });

    } catch (error) {
        console.error(`[PUT /api/chat/.../${req.params.messageId}/edit] Error:`, error);
        res.status(500).json({ message: 'Server error while editing message and regenerating response', error: error.message });
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