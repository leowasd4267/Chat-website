import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Firebase Admin SDK 초기화
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  console.log('✅ Firebase Admin SDK 초기화 성공');
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log('✅ Firebase가 이미 초기화되었습니다.');
  } else {
    console.warn('⚠️ Firebase 초기화 경고:', error.message);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin;
