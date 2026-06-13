import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Mock database (실제로는 Firebase를 사용)
const users = new Map();
const usernameIndex = new Map();
const emailIndex = new Map();

// 회원가입
router.post('/register', [
  body('email')
    .isEmail().withMessage('유효한 이메일을 입력하세요')
    .normalizeEmail(),
  body('username')
    .isLength({ min: 3 }).withMessage('아이디는 최소 3글자 이상이어야 합니다')
    .trim()
    .escape(),
  body('password')
    .isLength({ min: 6 }).withMessage('비밀번호는 최소 6글자 이상이어야 합니다'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
    return true;
  })
], async (req, res) => {
  try {
    console.log('📝 회원가입 요청:', { email: req.body.email, username: req.body.username });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ 검증 오류:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    // 중복 아이디/이메일 검사
    if (usernameIndex.has(username)) {
      console.warn('⚠️ 중복 아이디:', username);
      return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
    }

    if (emailIndex.has(email)) {
      console.warn('⚠️ 중복 이메일:', email);
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    emailIndex.set(email, userId);

    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'default-secret-key', { expiresIn: '7d' });

    console.log('✅ 회원가입 성공:', userId);
    
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
  } catch (error) {
    console.error('❌ 회원가입 서버 오류:', error);
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', [
  body('username').notEmpty().withMessage('아이디를 입력하세요'),
  body('password').notEmpty().withMessage('비밀번호를 입력하세요')
], async (req, res) => {
  try {
    console.log('🔐 로그인 요청:', { username: req.body.username });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ 검증 오류:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const userId = usernameIndex.get(username);

    if (!userId) {
      console.warn('⚠️ 사용자 없음:', username);
      return res.status(400).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = users.get(userId);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.warn('⚠️ 비밀번호 오류:', username);
      return res.status(400).json({ message: '비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'default-secret-key', { expiresIn: '7d' });

    console.log('✅ 로그인 성공:', userId);
    
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
  } catch (error) {
    console.error('❌ 로그인 서버 오류:', error);
    res.status(500).json({ message: '로그인 중 오류가 발생했습니다.' });
  }
});

// 비밀번호 재설정
router.post('/reset-password', [
  body('username').notEmpty(),
  body('email').isEmail(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const { username, email, newPassword } = req.body;
    const userId = usernameIndex.get(username);

    if (!userId || users.get(userId).email !== email) {
      return res.status(400).json({ message: '사용자 정보가 일치하지 않습니다.' });
    }

    const user = users.get(userId);
    user.password = await bcrypt.hash(newPassword, 10);

    console.log('✅ 비밀번호 변경:', username);
    
    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error('❌ 비밀번호 재설정 오류:', error);
    res.status(500).json({ message: '비밀번호 재설정 중 오류가 발생했습니다.' });
  }
});

export default router;
