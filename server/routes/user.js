import express from 'express';
const router = express.Router();

// Mock user database
const userProfiles = new Map();

// 프로필 조회
router.get('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const profile = userProfiles.get(userId);
  
  if (!profile) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  }
  
  res.json(profile);
});

// 프로필 업데이트
router.put('/profile', (req, res) => {
  const userId = req.userId;
  const { nickname, profileImage } = req.body;
  
  let profile = userProfiles.get(userId) || { userId, nickname: '', profileImage: '' };
  
  if (nickname) profile.nickname = nickname;
  if (profileImage) profile.profileImage = profileImage;
  profile.updatedAt = new Date().toISOString();
  
  userProfiles.set(userId, profile);
  
  res.json({ message: '프로필이 업데이트되었습니다.', profile });
});

// 상태 업데이트
router.put('/status', (req, res) => {
  const userId = req.userId;
  const { status } = req.body; // 'online', 'offline', 'away'
  
  let profile = userProfiles.get(userId) || { userId };
  profile.status = status;
  profile.lastStatusUpdate = new Date().toISOString();
  
  userProfiles.set(userId, profile);
  
  res.json({ message: '상태가 업데이트되었습니다.' });
});

export default router;
