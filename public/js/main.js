import { initAuth } from './auth.js';
import { initChat } from './chat.js';
import { loadTheme, toggleTheme } from './theme.js';

const app = document.getElementById('app');

// Load saved theme
loadTheme();

// Check if user is logged in
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

if (token && user) {
  initChat();
} else {
  initAuth();
}

// Listen for auth changes
window.addEventListener('auth-success', () => {
  initChat();
});

window.addEventListener('logout', () => {
  initAuth();
});
