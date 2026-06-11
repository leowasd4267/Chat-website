import express from 'express';
const router = express.Router();

// Mock message database
const messages = new Map();

// 메시지 조회
router.get('/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  const roomMessages = messages.get(roomId) || [];
  const result = roomMessages
    .slice(-parseInt(limit) - parseInt(offset), -parseInt(offset) || undefined)
    .reverse();
  
  res.json({
    messages: result,
    total: roomMessages.length
  });
});

// 메시지 저장 (Socket.IO와 동시에 저장)
router.post('/save', (req, res) => {
  const { roomId, message, userId, userName, profileImage } = req.body;
  
  if (!messages.has(roomId)) {
    messages.set(roomId, []);
  }
  
  const messageData = {
    id: `msg_${Date.now()}_${Math.random()}`,
    userId,
    userName,
    profileImage,
    message,
    timestamp: new Date().toISOString()
  };
  
  messages.get(roomId).push(messageData);
  
  res.status(201).json({ message: '메시지가 저장되었습니다.', messageData });
});

// 메시지 삭제
router.delete('/:roomId/:messageId', (req, res) => {
  const { roomId, messageId } = req.params;
  const roomMessages = messages.get(roomId);
  
  if (!roomMessages) {
    return res.status(404).json({ message: '메시지를 찾을 수 없습니다.' });
  }
  
  const index = roomMessages.findIndex(m => m.id === messageId);
  if (index !== -1) {
    roomMessages.splice(index, 1);
  }
  
  res.json({ message: '메시지가 삭제되었습니다.' });
});

export default router;
