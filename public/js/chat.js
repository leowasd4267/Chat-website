const API_URL = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3000/api';
const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

console.log('📡 Socket 서버 URL:', SOCKET_URL);
console.log('🌐 API URL:', API_URL);

let socket = null;
let currentRoom = 'class-room-1';
let currentUser = null;

// Socket 초기화
function initializeSocket() {
  if (socket && socket.connected) {
    console.log('⚠️ Socket이 이미 연결됨');
    return socket;
  }

  console.log('📡 Socket 연결 중...');
  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Socket 연결 성공:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket 연결 오류:', error);
  });

  socket.on('disconnect', () => {
    console.warn('⚠️ Socket 연결 해제');
  });

  return socket;
}

export function initChat() {
  const app = document.getElementById('app');
  
  if (!app) {
    console.error('❌ #app 요소를 찾을 수 없습니다!');
    return;
  }

  try {
    currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
      console.error('❌ 사용자 정보 없음');
      return;
    }

    console.log('👤 현재 사용자:', currentUser.username);

    app.innerHTML = `
      <div class="chat-container">
        <div class="sidebar">
          <div class="sidebar-header">
            <div class="user-info">
              <img src="${currentUser.profileImage || 'https://via.placeholder.com/40'}" alt="avatar" class="user-avatar">
              <div class="user-details">
                <div class="nickname">${currentUser.nickname || currentUser.username}</div>
                <div class="status"><span class="status-indicator online"></span>온라인</div>
              </div>
            </div>
            <div class="menu-buttons">
              <button class="menu-btn" onclick="window.openProfile()">👤</button>
              <button class="menu-btn" onclick="window.toggleDarkMode()">🌙</button>
              <button class="menu-btn" onclick="window.logout()">🚪</button>
            </div>
          </div>
          <div class="rooms-list">
            <div class="room-item active" onclick="window.switchRoom('class-room-1')">
              <div class="room-name">1학년 1반</div>
              <div class="room-meta">32명 온라인</div>
            </div>
            <div class="room-item" onclick="window.switchRoom('class-room-2')">
              <div class="room-name">선생님 공지</div>
              <div class="room-meta">선생님</div>
            </div>
          </div>
        </div>
        <div class="main-chat">
          <div class="chat-header">
            <h2>1학년 1반 채팅방</h2>
            <div class="header-controls">
              <button class="icon-btn" onclick="window.openUserList()">👥</button>
            </div>
          </div>
          <div class="messages-container" id="messagesContainer"></div>
          <div class="input-area">
            <div class="input-wrapper">
              <input type="text" id="messageInput" placeholder="메시지를 입력하세요..." />
              <button class="send-btn" onclick="window.sendMessage()">➤</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Socket 초기화
    initializeSocket();
    setupSocketEvents();
    joinRoom();

    console.log('✅ 채팅 화면 초기화 완료');
  } catch (error) {
    console.error('❌ Chat 초기화 오류:', error);
    app.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        flex-direction: column;
        font-family: sans-serif;
      ">
        <h2>채팅 로드 중 오류</h2>
        <p style="color: red;">에러: ${error.message}</p>
        <button onclick="window.logout()" style="
          margin-top: 20px;
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">로그인으로 돌아가기</button>
      </div>
    `;
  }
}

function setupSocketEvents() {
  if (!socket) return;

  socket.on('new-message', (data) => {
    console.log('💬 새 메시지:', data);
    if (data.roomId === currentRoom) {
      displayMessage(data);
    }
  });

  socket.on('user-joined', (data) => {
    console.log('👥 사용자 입장:', data);
    if (data.roomId === currentRoom) {
      displaySystemMessage(`${data.userName}님이 입장했습니다. (${data.userCount}명)`);
    }
  });

  socket.on('user-left', (data) => {
    console.log('👋 사용자 퇴장:', data);
    displaySystemMessage(`${data.userName}님이 퇴장했습니다. (${data.userCount}명)`);
  });

  socket.on('error', (data) => {
    console.error('❌ Socket 오류:', data);
    alert(data.message);
  });
}

function joinRoom() {
  if (!socket || !currentUser) return;

  console.log('🚪 채팅방 입장:', currentRoom);
  
  socket.emit('join-room', {
    userId: currentUser.userId,
    roomId: currentRoom,
    userName: currentUser.nickname || currentUser.username,
    profileImage: currentUser.profileImage || 'https://via.placeholder.com/40'
  });
}

function displayMessage(data) {
  const container = document.getElementById('messagesContainer');
  if (!container) return;

  const isOwn = data.userId === currentUser.userId;
  
  const messageEl = document.createElement('div');
  messageEl.className = `message ${isOwn ? 'own' : ''}`;
  messageEl.innerHTML = `
    <div class="message-content">
      <img src="${data.profileImage || 'https://via.placeholder.com/40'}" alt="avatar" class="message-avatar" onerror="this.src='https://via.placeholder.com/40'">
      <div>
        <div class="message-bubble">${escapeHtml(data.message)}</div>
        <div class="message-time">${formatTime(data.timestamp)}</div>
      </div>
    </div>
  `;
  
  container.appendChild(messageEl);
  container.scrollTop = container.scrollHeight;
}

function displaySystemMessage(text) {
  const container = document.getElementById('messagesContainer');
  if (!container) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'system-message';
  msgEl.textContent = text;
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

window.sendMessage = () => {
  const input = document.getElementById('messageInput');
  if (!input) return;

  const message = input.value.trim();
  
  if (message && socket) {
    console.log('📤 메시지 전송:', message);
    socket.emit('send-message', {
      message,
      roomId: currentRoom,
      userId: currentUser.userId
    });
    input.value = '';
  }
};

window.switchRoom = (roomId) => {
  console.log('🔄 채팅방 변경:', roomId);
  currentRoom = roomId;
  const container = document.getElementById('messagesContainer');
  if (container) {
    container.innerHTML = '';
  }
  joinRoom();
};

window.logout = () => {
  console.log('🚪 로그아웃');
  if (socket) {
    socket.disconnect();
  }
  localStorage.clear();
  window.dispatchEvent(new Event('logout'));
};

window.openProfile = () => {
  alert('프로필 기능은 준비 중입니다.');
};

window.toggleDarkMode = () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
};

window.openUserList = () => {
  alert('사용자 목록 기능은 준비 중입니다.');
};

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

// Allow Enter key to send message
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement.id === 'messageInput') {
    e.preventDefault();
    window.sendMessage();
  }
});

console.log('✅ Chat.js 로드 완료');
