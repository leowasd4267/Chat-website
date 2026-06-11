{
  "name": "classroom-web",
  "version": "1.0.0",
  "description": "KakaoTalk Style Classroom Website",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "firebase-admin": "^12.1.1",
    "socket.io": "^4.7.5"
  }
}


PORT=3000
# Firebase Service Account JSON 내용을 한 줄의 문자열로 압축하여 입력합니다.
FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", "project_id": "..."}'
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"



const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Firebase Admin SDK 초기화
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 금칙어 목록 (메모리 캐싱)
let bannedWords = ['욕설1', '욕설2', '비속어']; 

// XSS 방지 필터 함수
function sanitizeString(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;'
  })[m]);
}

// 금칙어 필터링 함수
function filterBadWords(text) {
  let filtered = text;
  bannedWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}

// 실시간 접속 유저 관리
const activeUsers = new Map();

io.on('connection', (socket) => {
  let currentUserId = null;

  // 유저 입장
  socket.on('join', async ({ userId, username, role }) => {
    currentUserId = userId;
    activeUsers.set(userId, { socketId: socket.id, username, role });
    
    io.emit('status_change', { userId, status: 'online' });
    io.emit('system_message', { 
      text: `${username}님이 입장하셨습니다.`, 
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) 
    });
  });

  // 메시지 전송 처리
  socket.on('send_message', async (data) => {
    if (!currentUserId) return;
    
    let cleanText = sanitizeString(data.text);
    cleanText = filterBadWords(cleanText);

    const messageData = {
      userId: data.userId,
      username: data.username,
      profilePic: data.profilePic || '/css/default-profile.png',
      text: cleanText,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      timeString: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      isNotice: data.isNotice || false
    };

    // Firestore에 기록 저장
    const docRef = await db.collection('messages').add(messageData);
    messageData.id = docRef.id;

    io.emit('receive_message', messageData);
  });

  // 관리자 기능: 메시지 삭제
  socket.on('delete_message', async ({ messageId, adminId }) => {
    const user = activeUsers.get(adminId);
    if (user && user.role === 'admin') {
      await db.collection('messages').doc(messageId).delete();
      io.emit('message_deleted', messageId);
    }
  });

  // 관리자 기능: 강제 퇴장
  socket.on('kick_user', ({ targetUserId, adminId }) => {
    const user = activeUsers.get(adminId);
    if (user && user.role === 'admin') {
      const targetUser = activeUsers.get(targetUserId);
      if (targetUser) {
        io.to(targetUser.socketId).emit('kicked');
      }
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    if (currentUserId) {
      const user = activeUsers.get(currentUserId);
      activeUsers.delete(currentUserId);
      io.emit('status_change', { userId: currentUserId, status: 'offline' });
      if (user) {
        io.emit('system_message', { 
          text: `${user.username}님이 퇴장하셨습니다.`, 
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) 
        });
      }
    }
  });
});

// REST API: 최근 메시지 로드 (최신 50개)
app.get('/api/messages', async (req, res) => {
  try {
    const snapshot = await db.collection('messages').orderBy('timestamp', 'desc').limit(50).get();
    const messages = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      messages.push({ id: doc.id, ...data });
    });
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));



<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>학급 커뮤니티 - 로그인</title>
  <link rel="stylesheet" href="/css/style.css">
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
</head>
<body class="auth-body">
  <div class="auth-container">
    <h2 id="auth-title">우리반 웹사이트</h2>
    
    <div id="login-form">
      <input type="email" id="login-email" placeholder="이메일 주소" required>
      <input type="password" id="login-password" placeholder="비밀번호" required>
      <button onclick="login()">로그인</button>
      <div class="auth-toggle">
        <span onclick="toggleAuth(true)">회원가입</span> | <span onclick="resetPassword()">비밀번호 재설정</span>
      </div>
    </div>

    <div id="register-form" style="display:none;">
      <input type="email" id="reg-email" placeholder="이메일 주소" required>
      <input type="password" id="reg-password" placeholder="비밀번호 (6자 이상)" required>
      <input type="text" id="reg-username" placeholder="실명 또는 닉네임" required>
      <button onclick="register()">가입하기</button>
      <div class="auth-toggle"><span onclick="toggleAuth(false)">로그인으로 돌아가기</span></div>
    </div>
  </div>

  <script src="/js/main.js"></script>
</body>
</html>



<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>학급 단체 채팅방</title>
  <link rel="stylesheet" href="/css/style.css">
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script src="/socket.io/socket.io.js"></script>
</head>
<body class="chat-theme">
  <div class="chat-wrapper">
    <header class="chat-header">
      <div class="room-info">
        <h3>우리반 단체방</h3>
        <span id="user-count">접속 중...</span>
      </div>
      <div class="header-actions">
        <button id="dark-mode-toggle" onclick="toggleDarkMode()">🌙</button>
        <button onclick="logout()" class="btn-logout">로그아웃</button>
      </div>
    </header>

    <div id="notice-bar" class="notice-bar" style="display: none;">
      <span class="notice-badge">공지</span>
      <p id="notice-text">지각하지 맙시다!</p>
    </div>

    <main class="chat-area" id="chat-area">
      </main>

    <footer class="chat-footer">
      <div class="admin-checkbox" id="admin-box" style="display:none;">
        <input type="checkbox" id="is-notice"> <label for="is-notice">공지로 등록</label>
      </div>
      <div class="input-group">
        <textarea id="msg-input" placeholder="메시지를 입력하세요..." onkeydown="handleEnter(event)"></textarea>
        <button id="send-btn" onclick="sendMessage()">전송</button>
      </div>
    </footer>
  </div>

  <script src="/js/main.js"></script>
  <script>
    // 페이지 로드시 인증 체크 및 채팅 초기화
    window.onload = () => {
      checkChatAuth();
    };
  </script>
</body>
</html>



:root {
  --bg-color: #b2c7da; /* 카카오톡 기본 배경색 */
  --chat-my-bg: #fee500; /* 카카오톡 노란색 */
  --chat-other-bg: #ffffff;
  --text-color: #000000;
  --header-bg: #a9bdce;
  --footer-bg: #eeeeee;
  --card-bg: #ffffff;
}

[data-theme="dark"] {
  --bg-color: #1e1e1e;
  --chat-my-bg: #3a3a3c;
  --chat-other-bg: #2c2c2e;
  --text-color: #ffffff;
  --header-bg: #2c2c2e;
  --footer-bg: #1c1c1e;
  --card-bg: #2c2c2e;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif;
  background-color: #f0f2f5;
}

/* 인증 화면 */
.auth-body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f6fa;
}
.auth-container {
  background: var(--card-bg);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 360px;
  text-align: center;
}
.auth-container input {
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.auth-container button {
  width: 100%;
  padding: 12px;
  background: #fee500;
  border: none;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}

/* 채팅창 메인 레이아웃 (반응형 모바일 우선) */
.chat-theme {
  background-color: var(--bg-color);
  display: flex;
  justify-content: center;
  height: 100vh;
}
.chat-wrapper {
  width: 100%;
  max-width: 480px; /* PC 전용 거치형 디자인 규격 */
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  height: 100%;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
}

.chat-header {
  background-color: var(--header-bg);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-color);
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 카카오톡 말풍선 스타일 */
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 85%;
}
.msg-row.me {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.msg-bubble {
  background-color: var(--chat-other-bg);
  color: var(--text-color);
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-all;
}
.msg-row.me .msg-bubble {
  background-color: var(--chat-my-bg);
  color: #000000;
}
.msg-time {
  font-size: 10px;
  color: #666;
  align-self: flex-end;
  white-space: nowrap;
}

.notice-bar {
  background-color: rgba(0,0,0,0.7);
  color: #fff;
  padding: 10px;
  display: flex;
  gap: 10px;
  font-size: 13px;
}
.notice-badge {
  background: #ff4757;
  padding: 2px 6px;
  border-radius: 4px;
}

.chat-footer {
  background-color: var(--footer-bg);
  padding: 10px;
}
.input-group {
  display: flex;
  gap: 8px;
}
.chat-footer textarea {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: none;
  padding: 8px;
}
.chat-footer button {
  background: #fee500;
  border: none;
  padding: 0 16px;
  border-radius: 6px;
  font-weight: bold;
}



// Firebase Config 설정 (웹 SDK 발급 정보 입력)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
let socket;
let currentUser = null;

// 세션 유지 설정
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

function toggleAuth(isReg) {
  document.getElementById('login-form').style.display = isReg ? 'none' : 'block';
  document.getElementById('register-form').style.display = isReg ? 'block' : 'none';
  document.getElementById('auth-title').innerText = isReg ? '반갑습니다!' : '우리반 웹사이트';
}

// 회원가입
async function register() {
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const username = document.getElementById('reg-username').value;

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName: username });
    alert('회원가입이 완료되었습니다!');
    location.reload();
  } catch (error) {
    alert(error.message);
  }
}

// 로그인
async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    location.href = '/chat.html';
  } catch (error) {
    alert('로그인 실패: ' + error.message);
  }
}

// 비밀번호 재설정
function resetPassword() {
  const email = prompt('비밀번호를 재설정할 이메일을 입력하세요:');
  if (email) {
    auth.sendPasswordResetEmail(email)
      .then(() => alert('비밀번호 재설정 메일이 발송되었습니다.'))
      .catch(err => alert(err.message));
  }
}

// 채팅 페이지 접근 권한 관리 및 소켓 연결
function checkChatAuth() {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      location.href = '/index.html';
    } else {
      currentUser = user;
      initSocket();
      loadRecentMessages();
    }
  });
}

// 실시간 소켓 초기화
function initSocket() {
  socket = io();

  // 특정 계정을 관리자로 설정 (예시 이메일 판별 또는 Firebase Custom Claims 대응 가능)
  const isAdmin = currentUser.email.includes('admin@') || currentUser.email === 'teacher@school.com';
  if (isAdmin) {
    currentUser.role = 'admin';
    if(document.getElementById('admin-box')) document.getElementById('admin-box').style.display = 'block';
  } else {
    currentUser.role = 'student';
  }

  socket.emit('join', {
    userId: currentUser.uid,
    username: currentUser.displayName || '익명',
    role: currentUser.role
  });

  socket.on('receive_message', (msg) => {
    renderMessage(msg);
  });

  socket.on('system_message', (data) => {
    const area = document.getElementById('chat-area');
    area.innerHTML += `<div class="system-msg" style="text-align:center; color:#555; font-size:12px; margin:5px 0;">${data.text} (${data.time})</div>`;
    area.scrollTop = area.scrollHeight;
  });

  socket.on('kicked', () => {
    alert('관리자에 의해 강제 퇴장 처리되었습니다.');
    logout();
  });
}

// REST API로 기존 데이터 캐싱 로드
async function loadRecentMessages() {
  const res = await fetch('/api/messages');
  const messages = await res.json();
  messages.forEach(msg => renderMessage(msg));
}

// 메시지 DOM 렌더링
function renderMessage(msg) {
  const area = document.getElementById('chat-area');
  if (!area) return;

  if (msg.isNotice) {
    const noticeBar = document.getElementById('notice-bar');
    if (noticeBar) {
      noticeBar.style.display = 'flex';
      document.getElementById('notice-text').innerText = msg.text;
    }
  }

  const isMe = msg.userId === currentUser.uid;
  const adminDeleteBtn = currentUser.role === 'admin' ? `<button onclick="deleteMsg('${msg.id}')" style="font-size:10px; background:none; border:none; color:red; cursor:pointer;">삭제</button>` : '';
  const adminKickBtn = (currentUser.role === 'admin' && !isMe) ? `<button onclick="kickUser('${msg.userId}')" style="font-size:10px; background:none; border:none; color:orange; cursor:pointer;">추방</button>` : '';

  const html = `
    <div class="msg-row ${isMe ? 'me' : ''}" id="msg-${msg.id}">
      <div class="msg-content">
        <div class="msg-user" style="font-size:11px; margin-bottom:2px; color:#555;">${msg.username} ${adminKickBtn}</div>
        <div style="display:flex; gap:4px; flex-direction: ${isMe ? 'row-reverse' : 'row'}">
          <div class="msg-bubble">${msg.text}</div>
          <span class="msg-time">${msg.timeString} ${adminDeleteBtn}</span>
        </div>
      </div>
    </div>
  `;
  area.innerHTML += html;
  area.scrollTop = area.scrollHeight;
}

// 전송 버튼 핸들러
function sendMessage() {
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if (!text) return;

  const isNotice = document.getElementById('is-notice') ? document.getElementById('is-notice').checked : false;

  socket.emit('send_message', {
    userId: currentUser.uid,
    username: currentUser.displayName,
    text: text,
    isNotice: isNotice
  });

  input.value = '';
}

function handleEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// 관리자 기능 인터페이스 타겟팅
function deleteMsg(msgId) {
  if(confirm('이 메시지를 삭제하시겠습니까?')) {
    socket.emit('delete_message', { messageId: msgId, adminId: currentUser.uid });
  }
}

function kickUser(targetId) {
  if(confirm('이 사용자를 강제퇴장 시키겠습니까?')) {
    socket.emit('kick_user', { targetUserId: targetId, adminId: currentUser.uid });
  }
}

// 다크모드 스위칭 토글
function toggleDarkMode() {
  const currentTheme = document.body.getAttribute('data-theme');
  const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', targetTheme);
  document.getElementById('dark-mode-toggle').innerText = targetTheme === 'dark' ? '☀️' : '🌙';
}

function logout() {
  auth.signOut().then(() => {
    location.href = '/index.html';
  });
}
