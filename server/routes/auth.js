import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Mock database (실제로는 Firebase를 사용)
const users = new Map();
const usernameIndex = new Map();

// 회원가입
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 }),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, username, password } = req.body;

  // 중복 아이디/이메일 검사
  if (usernameIndex.has(username)) {
    return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
  }

  const userId = `user_${Date.now()}_${Math.random()}`;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    userId,
    email,
    username,
    password: hashedPassword,
    nickname: username,
    profileImage: 'https://via.placeholder.com/40',
    status: 'offline',
    isAdmin: false,
    createdAt: new Date().toISOString()
  };

  users.set(userId, user);
  usernameIndex.set(username, userId);

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    message: '회원가입 성공',
    token,
    user: {
      userId,
      email,
      username,
      nickname: user.nickname,
      profileImage: user.profileImage
    }
  });
});

// 로그인
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const userId = usernameIndex.get(username);

  if (!userId) {
    return res.status(400).json({ message: '사용자를 찾을 수 없습니다.' });
  }

  const user = users.get(userId);
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({ message: '비밀번호가 올바르지 않습니다.' });
  }

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: '로그인 성공',
    token,
    user: {
      userId,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      profileImage: user.profileImage,
      isAdmin: user.isAdmin
    }
  });
});

// 비밀번호 재설정
router.post('/reset-password', [
  body('username').notEmpty(),
  body('email').isEmail(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const { username, email, newPassword } = req.body;
  const userId = usernameIndex.get(username);

  if (!userId || users.get(userId).email !== email) {
    return res.status(400).json({ message: '사용자 정보가 일치하지 않습니다.' });
  }

  const user = users.get(userId);
  user.password = await bcrypt.hash(newPassword, 10);

  res.json({ message: '비밀번호가 변경되었습니다.' });
});

export default router;
