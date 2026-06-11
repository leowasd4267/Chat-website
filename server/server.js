import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import messageRoutes from './routes/message.js';
import { verifyToken } from './middleware/auth.js';
import messageHandler from './handlers/messageHandler.js';
import userHandler from './handlers/userHandler.js';
import adminHandler from './handlers/adminHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e6
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Store socket connections
const userSockets = new Map();
const roomUsers = new Map();
const bannedUsers = new Set();
const blockedWords = new Set(['욕설', '차단단어']);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', verifyToken, userRoutes);
app.use('/api/message', verifyToken, messageRoutes);

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log('사용자 연결:', socket.id);

  socket.on('join-room', (data) => {
    const { userId, roomId, userName, profileImage } = data;
    
    if (bannedUsers.has(userId)) {
      socket.emit('error', { message: '차단된 사용자입니다.' });
      return;
    }

    socket.join(roomId);
    userSockets.set(socket.id, { userId, roomId, userName, profileImage });

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, []);
    }
    roomUsers.get(roomId).push({ socketId: socket.id, userId, userName, profileImage });

    io.to(roomId).emit('user-joined', {
      userId,
      userName,
      profileImage,
      timestamp: new Date().toISOString(),
      userCount: roomUsers.get(roomId).length
    });
  });

  socket.on('send-message', (data) => {
    const user = userSockets.get(socket.id);
    if (!user) return;

    const { message, roomId } = data;
    let filteredMessage = message;

    // Filter banned words
    blockedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
    });

    io.to(roomId).emit('new-message', {
      userId: user.userId,
      userName: user.userName,
      profileImage: user.profileImage,
      message: filteredMessage,
      timestamp: new Date().toISOString(),
      messageId: `${Date.now()}_${Math.random()}`
    });
  });

  socket.on('user-typing', (data) => {
    const user = userSockets.get(socket.id);
    if (!user) return;
    
    socket.to(user.roomId).emit('user-typing', {
      userId: user.userId,
      userName: user.userName
    });
  });

  socket.on('user-status', (data) => {
    const user = userSockets.get(socket.id);
    if (!user) return;

    io.to(user.roomId).emit('user-status-changed', {
      userId: user.userId,
      status: data.status
    });
  });

  socket.on('delete-message', (data) => {
    const user = userSockets.get(socket.id);
    if (!user) return;

    io.to(user.roomId).emit('message-deleted', {
      messageId: data.messageId
    });
  });

  socket.on('disconnect', () => {
    const user = userSockets.get(socket.id);
    if (user) {
      const roomUsers_ = roomUsers.get(user.roomId);
      if (roomUsers_) {
        const index = roomUsers_.findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
          roomUsers_.splice(index, 1);
        }
      }

      io.to(user.roomId).emit('user-left', {
        userId: user.userId,
        userName: user.userName,
        timestamp: new Date().toISOString(),
        userCount: roomUsers_.length
      });
      
      userSockets.delete(socket.id);
    }
    console.log('사용자 연결 해제:', socket.id);
  });
});

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});

export { io, userSockets, roomUsers, bannedUsers, blockedWords };
