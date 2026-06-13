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
import { db } from './firebase-config.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// CORS 설정 (Render 배포용)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  process.env.SERVER_URL
].filter(Boolean);

console.log('🔗 허용된 CORS Origin:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS 거부됨:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 1e6,
  transports: ['websocket', 'polling']
});

// Middleware
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log('✅ 사용자 연결:', socket.id);

  socket.on('join-room', async (data) => {
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

    // Firebase에 사용자 정보 저장
    try {
      await db.collection('rooms').doc(roomId).collection('users').doc(userId).set({
        userId,
        userName,
        profileImage,
        joinedAt: new Date(),
        status: 'online'
      }, { merge: true });
    } catch (error) {
      console.error('Firebase 사용자 저장 실패:', error);
    }

    io.to(roomId).emit('user-joined', {
      userId,
      userName,
      profileImage,
      timestamp: new Date().toISOString(),
      userCount: roomUsers.get(roomId).length
    });
  });

  socket.on('send-message', async (data) => {
    const user = userSockets.get(socket.id);
    if (!user) return;

    const { message, roomId } = data;
    let filteredMessage = message;

    // Filter banned words
    blockedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
    });

    const messageData = {
      userId: user.userId,
      userName: user.userName,
      profileImage: user.profileImage,
      message: filteredMessage,
      timestamp: new Date().toISOString(),
      messageId: `${Date.now()}_${Math.random()}`
    };

    // Firebase에 메시지 저장
    try {
      await db.collection('messages').add({
        roomId,
        userId: user.userId,
        userName: user.userName,
        profileImage: user.profileImage,
        content: filteredMessage,
        timestamp: new Date(),
        messageId: messageData.messageId
      });
    } catch (error) {
      console.error('Firebase 메시지 저장 실패:', error);
    }

    io.to(roomId).emit('new-message', messageData);
  });

  socket.on('user-typing', (data) => {
    const user = userSockets.get(socket.id);
    if (!user) return;
    
    socket.to(user.roomId).emit('user-typing', {
      userId: user.userId,
      userName: user.userName
    });
  });

  socket.on('user-status', async (data) => {
    const user = userSockets.get(socket.id);
    if (!user) return;

    // Firebase에 상태 저장
    try {
      await db.collection('rooms').doc(user.roomId).collection('users').doc(user.userId).update({
        status: data.status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Firebase 상태 업데이트 실패:', error);
    }

    io.to(user.roomId).emit('user-status-changed', {
      userId: user.userId,
      status: data.status
    });
  });

  socket.on('delete-message', async (data) => {
    const user = userSockets.get(socket.id);
    if (!user) return;

    // Firebase에서 메시지 삭제
    try {
      const snapshot = await db.collection('messages')
        .where('messageId', '==', data.messageId)
        .where('userId', '==', user.userId)
        .get();

      snapshot.forEach(doc => {
        doc.ref.delete();
      });
    } catch (error) {
      console.error('Firebase 메시지 삭제 실패:', error);
    }

    io.to(user.roomId).emit('message-deleted', {
      messageId: data.messageId
    });
  });

  socket.on('disconnect', async () => {
    const user = userSockets.get(socket.id);
    if (user) {
      const roomUsers_ = roomUsers.get(user.roomId);
      if (roomUsers_) {
        const index = roomUsers_.findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
          roomUsers_.splice(index, 1);
        }
      }

      // Firebase에서 사용자 상태 업데이트
      try {
        await db.collection('rooms').doc(user.roomId).collection('users').doc(user.userId).update({
          status: 'offline',
          disconnectedAt: new Date()
        });
      } catch (error) {
        console.error('Firebase 사용자 상태 업데이트 실패:', error);
      }

      io.to(user.roomId).emit('user-left', {
        userId: user.userId,
        userName: user.userName,
        timestamp: new Date().toISOString(),
        userCount: roomUsers_?.length || 0
      });
      
      userSockets.delete(socket.id);
    }
    console.log('❌ 사용자 연결 해제:', socket.id);
  });
});

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📡 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 서버 URL: ${process.env.SERVER_URL || 'http://localhost:3000'}`);
  console.log(`✅ CORS 활성화됨`);
});

export { io, userSockets, roomUsers, bannedUsers, blockedWords };
