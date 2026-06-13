import { initAuth } from './auth.js';
import { initChat } from './chat.js';
import { loadTheme, toggleTheme } from './theme.js';

const app = document.getElementById('app');

console.log('🚀 메인 JS 로드 시작');

// DOM Ready 확인
if (!app) {
  console.error('❌ #app 요소를 찾을 수 없습니다!');
  document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">❌ 페이지 로드 오류</h1>';
} else {
  console.log('✅ #app 요소 발견');
}

try {
  // Load saved theme
  loadTheme();
  console.log('✅ 테마 로드 완료');
} catch (error) {
  console.error('⚠️ 테마 로드 오류:', error);
}

// Check if user is logged in
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('🔐 저장된 인증 정보:', { token: !!token, user: !!user });

try {
  if (token && user) {
    console.log('🚪 채팅 화면 초기화');
    initChat();
  } else {
    console.log('🔓 로그인 화면 초기화');
    initAuth();
  }
} catch (error) {
  console.error('❌ 화면 초기화 오류:', error);
  app.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      flex-direction: column;
      font-family: sans-serif;
    ">
      <h2>페이지 로드 중 오류가 발생했습니다.</h2>
      <p style="color: red; margin-top: 10px;">에러: ${error.message}</p>
      <button onclick="location.reload()" style="
        margin-top: 20px;
        padding: 10px 20px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      ">새로고침</button>
    </div>
  `;
}

// Listen for auth changes
window.addEventListener('auth-success', () => {
  console.log('✅ 로그인 성공');
  try {
    initChat();
  } catch (error) {
    console.error('❌ 채팅 초기화 오류:', error);
  }
});

window.addEventListener('logout', () => {
  console.log('✅ 로그아웃');
  try {
    initAuth();
  } catch (error) {
    console.error('❌ 로그인 화면 초기화 오류:', error);
  }
});

console.log('🎉 메인 JS 로드 완료');
