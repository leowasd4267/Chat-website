// public/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCTrrxshsXxLqgN7PJMhqs2OMmh0pYseH8",
  authDomain: "chat-website-52846.firebaseapp.com",
  projectId: "chat-website-52846",
  storageBucket: "chat-website-52846.firebasestorage.app",
  messagingSenderId: "179196544245",
  appId: "1:179196544245:web:f4ffcb4ed8201d2bb871bc",
  measurementId: "G-VMN3RY891R"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

console.log('✅ Firebase 클라이언트 초기화 완료');

export default app;
