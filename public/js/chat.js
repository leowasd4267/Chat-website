const API_URL = 'http://localhost:3000/api';
const socket = io();
let currentRoom = 'class-room-1';
let currentUser = JSON.parse(localStorage.getItem('user'));

export function initChat() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="chat-container">
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="user-info">
            <img src="${currentUser.profileImage}" alt="avatar" class="user-avatar">
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

  setupSocketEvents();
  joinRoom();
}

function setupSocketEvents() {
  socket.on('new-message', (data) => {
    if (data.roomId === currentRoom) {
      displayMessage(data);
    }
  });

  socket.on('user-joined', (data) => {
    if (data.roomId === currentRoom) {
      displaySystemMessage(`${data.userName}님이 입장했습니다. (${data.userCount}명)`);
    }
  });

  socket.on('user-left', (data) => {
    displaySystemMessage(`${data.userName}님이 퇴장했습니다. (${data.userCount}명)`);
  });

  socket.on('error', (data) => {
    alert(data.message);
  });
}

function joinRoom() {
  socket.emit('join-room', {
    userId: currentUser.userId,
    roomId: currentRoom,
    userName: currentUser.nickname || currentUser.username,
    profileImage: currentUser.profileImage
  });
}

function displayMessage(data) {
  const container = document.getElementById('messagesContainer');
  const isOwn = data.userId === currentUser.userId;
  
  const messageEl = document.createElement('div');
  messageEl.className = `message ${isOwn ? 'own' : ''}`;
  messageEl.innerHTML = `
    <div class="message-content">
      <img src="${data.profileImage}" alt="avatar" class="message-avatar">
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
  const msgEl = document.createElement('div');
  msgEl.className = 'system-message';
  msgEl.textContent = text;
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

window.sendMessage = () => {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  
  if (message) {
    socket.emit('send-message', {
      message,
      roomId: currentRoom,
      userId: currentUser.userId
    });
    input.value = '';
  }
};

window.switchRoom = (roomId) => {
  currentRoom = roomId;
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';
  joinRoom();
};

window.logout = () => {
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
