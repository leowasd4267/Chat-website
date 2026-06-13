// public/js/auth.js
const API_URL = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3000/api';

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
      <div class="error-message" id="loginError" style="display: none; color: red; margin-top: 10px;"></div>
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
      <div class="error-message" id="registerError" style="display: none; color: red; margin-top: 10px;"></div>
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
  const loginError = document.getElementById('loginError');

  try {
    console.log('🔐 로그인 시도:', { username });
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    console.log('📡 로그인 응답:', { status: response.status, data });

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      loginError.style.display = 'none';
      window.dispatchEvent(new Event('auth-success'));
    } else {
      loginError.textContent = data.message || '로그인 실패';
      loginError.style.display = 'block';
      console.error('❌ 로그인 오류:', data);
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    loginError.textContent = '로그인 중 오류가 발생했습니다: ' + error.message;
    loginError.style.display = 'block';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const email = document.getElementById('regEmail').value;
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const registerError = document.getElementById('registerError');

  if (password !== confirmPassword) {
    registerError.textContent = '비밀번호가 일치하지 않습니다.';
    registerError.style.display = 'block';
    return;
  }

  try {
    console.log('📝 회원가입 시도:', { email, username });
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, confirmPassword })
    });

    const data = await response.json();
    console.log('📡 회원가입 응답:', { status: response.status, data });

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      registerError.style.display = 'none';
      window.dispatchEvent(new Event('auth-success'));
    } else {
      registerError.textContent = data.message || data.errors?.[0]?.msg || '회원가입 실패';
      registerError.style.display = 'block';
      console.error('❌ 회원가입 오류:', data);
    }
  } catch (error) {
    console.error('❌ Register error:', error);
    registerError.textContent = '회원가입 중 오류가 발생했습니다: ' + error.message;
    registerError.style.display = 'block';
  }
}
