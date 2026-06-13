# 🚀 Render 배포 가이드

## ✅ 배포 전 확인사항

1. **GitHub 커밋 완료** ✓
2. **모든 파일 동기화** ✓
3. **Firebase 프로젝트 생성** ✓
4. **환경 변수 준비** ✓

---

## 📋 Render 배포 단계

### 1단계: Render 계정 로그인
- https://render.com 방문
- GitHub 계정으로 로그인

### 2단계: 새 Web Service 생성
1. "New" → "Web Service" 클릭
2. GitHub 저장소 선택: `leowasd4267/Chat-website`
3. "Connect" 클릭

### 3단계: 배포 설정

| 항목 | 값 |
|------|-----|
| **Name** | `chat-website` |
| **Environment** | `Node` |
| **Region** | `Singapore` 또는 `Ohio` |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### 4단계: 환경 변수 설정

"Environment" 탭에서 다음을 추가하세요:

```
PORT=3000
NODE_ENV=production
JWT_SECRET=aB9$xK2@mQ7!pL5#nD8%vF3^jH6&wR4(sT1)zU0
SERVER_URL=https://chat-website-xyz.onrender.com

FIREBASE_API_KEY=AIzaSyCTrrxshsXxLqgN7PJMhqs2OMmh0pYseH8
FIREBASE_AUTH_DOMAIN=chat-website-52846.firebaseapp.com
FIREBASE_PROJECT_ID=chat-website-52846
FIREBASE_STORAGE_BUCKET=chat-website-52846.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=179196544245
FIREBASE_APP_ID=1:179196544245:web:f4ffcb4ed8201d2bb871bc
FIREBASE_MEASUREMENT_ID=G-VMN3RY891R
```

### 5단계: 배포
- "Create Web Service" 클릭
- 배포 로그 확인 (3-5분)
- 배포 완료 후 URL 제공

---

## 🔑 주요 기능

✅ **회원 관리**
- 이메일/아이디 회원가입
- JWT 토큰 인증
- 프로필 관리

✅ **실시간 채팅**
- Socket.IO 기반 실시간 통신
- Firebase Firestore 데이터 저장
- 메시지 필터링

✅ **사용자 상태 관리**
- 온라인/오프라인 표시
- 입장/퇴장 알림
- 입력 중 표시

✅ **데이터베이스**
- Firebase Firestore
- 메시지 영구 저장
- 실시간 동기화

---

## 📱 로컬 테스트

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 브라우저에서 확인
# http://localhost:3000
```

---

## ⚠️ 배포 시 주의사항

| 문제 | 해결 방법 |
|------|----------|
| **Port 에러** | Render이 자동으로 PORT 환경변수 할당 |
| **Socket.IO 연결 실패** | SERVER_URL이 실제 배포 도메인과 일치 확인 |
| **Firebase 오류** | 환경 변수 정확히 입력 확인 |
| **메모리 부족** | 무료 플랜: 약 30-40명 동시 접속 권장 |

---

## 🔒 보안 체크리스트

- [ ] JWT_SECRET 복잡한 문자열로 변경
- [ ] .env 파일이 .gitignore에 포함됨
- [ ] Firebase 보안 규칙 설정
- [ ] HTTPS 자동 적용 (Render)

---

## 📞 문제 발생 시

1. Render 대시보드 → "Logs" 탭에서 에러 확인
2. GitHub에서 최신 커밋 확인
3. Firebase 콘솔에서 데이터 확인

---

**배포 완료 후:**
- 친구들과 URL 공유
- 실시간 채팅 시작!
- 문제 발생 시 GitHub Issues에 등록
