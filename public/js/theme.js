export function loadTheme() {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) {
    document.body.classList.add('dark-mode');
  }
  console.log('✅ 테마 로드:', darkMode ? '다크 모드' : '라이트 모드');
}

export function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

console.log('✅ Theme.js 로드 완료');
