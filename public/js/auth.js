const API_URL = 'http://localhost:3000/api';

export function initAuth() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-form" id="authForm">
        <h2 id="authTitle">로그인</h2>
        <div id="authContent"></div>
      </div>
    </div>
  `;

  renderLoginForm();
}

function renderLoginForm() {
  const authContent = document.getElementById('authContent');
  
  authContent.innerHTML = `
    <form id="loginForm">
      <div class="form-group">
        <label for="username">아이디</label>
        <input type="text" id="username" required>
      </div>
      <div class="form-group">
        <label for="password">비밀번호</label>
        <input type="password" id="password" required>
      </div>
      <button type="submit" class="btn">로그인</button>
    </form>
    <div class="link">
      <a href="#" onclick="window.switchToRegister(event)">회원가입</a>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

function renderRegisterForm() {
  const authContent = document.getElementById('authContent');
  const authTitle = document.getElementById('authTitle');
  
  authTitle.textContent = '회원가입';
  authContent.innerHTML = `
    <form id="registerForm">
      <div class="form-group">
        <label for="regEmail">이메일</label>
        <input type="email" id="regEmail" required>
      </div>
      <div class="form-group">
        <label for="regUsername">아이디</label>
        <input type="text" id="regUsername" required>
      </div>
      <div class="form-group">
        <label for="regPassword">비밀번호</label>
        <input type="password" id="regPassword" required>
      </div>
      <div class="form-group">
        <label for="confirmPassword">비밀번호 확인</label>
        <input type="password" id="confirmPassword" required>
      </div>
      <button type="submit" class="btn">회원가입</button>
    </form>
    <div class="link">
      <a href="#" onclick="window.switchToLogin(event)">로그인</a>
    </div>
  `;

  document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

window.switchToRegister = (e) => {
  e.preventDefault();
  renderRegisterForm();
};

window.switchToLogin = (e) => {
  e.preventDefault();
  renderLoginForm();
};

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-success'));
    } else {
      alert(data.message || '로그인 실패');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('로그인 중 오류가 발생했습니다.');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const email = document.getElementById('regEmail').value;
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, confirmPassword })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-success'));
    } else {
      alert(data.message || '회원가입 실패');
    }
  } catch (error) {
    console.error('Register error:', error);
    alert('회원가입 중 오류가 발생했습니다.');
  }
}
