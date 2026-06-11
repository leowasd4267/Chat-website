# 학급 채팅 웹사이트

카카오톡 스타일의 학급용 실시간 채팅 웹사이트

## 🎯 주요 기능

### 1. 회원 관리
- ✅ 이메일/아이디 회원가입
- ✅ 비밀번호 암호화 (bcryptjs)
- ✅ 중복 아이디 검사
- ✅ 로그인/로그아웃
- ✅ 로그인 유지 (JWT Token)
- ✅ 비밀번호 재설정

### 2. 프로필 기능
- ✅ 닉네임 설정 및 변경
- ✅ 프로필 사진 업로드
- ✅ 접속 상태 표시 (온라인/오프라인/자리비움)

### 3. 실시간 채팅
- ✅ Socket.IO 기반 실시간 통신
- ✅ 메시지 전송 시간 표시
- ✅ 입장/퇴장 알림
- ✅ 채팅 기록 저장
- ✅ 최근 메시지 자동 로딩

### 4. 관리자 기능
- 관리자 계정 지정 가능
- 공지사항 작성
- 사용자 강제 퇴장
- 메시지 삭제
- 금칙어 관리

### 5. UI/UX
- ✅ 카카오톡 스타일 디자인
- ✅ 반응형 웹 (모바일/태블릿/PC)
- ✅ 다크모드 지원
- ✅ 깔끔하고 현대적인 인터페이스

### 6. 보안
- ✅ 비밀번호 해시 처리
- ✅ JWT 토큰 기반 인증
- ✅ 입력값 검증
- ✅ XSS 방지 (HTML 이스케이핑)
- ✅ 금칙어 필터링

## 🛠 기술 스택

### 프론트엔드
- **HTML5** - 마크업
- **CSS3** - 스타일링 (반응형, 다크모드)
- **JavaScript (ES6+)** - 동적 기능
- **Socket.IO Client** - 실시간 통신

### 백엔드
- **Node.js** - JavaScript 런타임
- **Express.js** - 웹 프레임워크
- **Socket.IO** - 실시간 양방향 통신
- **JWT** - 토큰 기반 인증
- **bcryptjs** - 비밀번호 암호화

### 데이터베이스
- **메모리 기반 저장** (현재 구현)
- **Firebase Firestore** 또는 **MongoDB**로 업그레이드 가능

## 📋 프로젝트 구조

```
Chat-website/
├── server/
│   ├── server.js                 # 메인 서버 파일
│   ├── middleware/
│   │   └── auth.js              # JWT 인증 미들웨어
│   ├── routes/
│   │   ├── auth.js              # 인증 라우트
│   │   ├── user.js              # 사용자 라우트
│   │   └── message.js           # 메시지 라우트
│   └── handlers/
│       ├── messageHandler.js     # 메시지 핸들러
│       ├── userHandler.js        # 사용자 핸들러
│       └── adminHandler.js       # 관리자 핸들러
├── public/
│   ├── index.html               # 메인 HTML
│   ├── css/
│   │   ├── style.css            # 메인 스타일
│   │   └── dark-mode.css        # 다크모드 스타일
│   └── js/
│       ├── main.js              # 앱 초기화
│       ├── auth.js              # 인증 로직
│       ├── chat.js              # 채팅 로직
│       └── theme.js             # 테마 관리
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/leowasd4267/Chat-website.git
cd Chat-website
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 열고 필요한 설정을 입력하세요:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
SERVER_URL=http://localhost:3000
```

### 4. 개발 서버 실행
```bash
npm run dev
```

또는 프로덕션 서버 실행:
```bash
npm start
```

### 5. 브라우저에서 접속
```
http://localhost:3000
```

## 📱 사용 방법

### 회원가입
1. "회원가입" 링크 클릭
2. 이메일, 아이디, 비밀번호 입력
3. 계정 생성 완료

### 로그인
1. 아이디와 비밀번호 입력
2. 로그인 버튼 클릭
3. 채팅방 입장

### 채팅하기
1. 왼쪽 사이드바에서 채팅방 선택
2. 메시지 입력 후 엔터 또는 전송 버튼 클릭
3. 실시간으로 메시지 수신

### 프로필 관리
1. 왼쪽 상단 프로필 이미지 또는 👤 버튼 클릭
2. 닉네임 변경, 프로필 사진 업로드
3. 저장 버튼으로 변경사항 적용

### 다크모드
1. 🌙 버튼 클릭으로 다크모드 토글
2. 설정이 로컬 스토리지에 저장됨

## 🔒 보안 기능

### 비밀번호 보안
- bcryptjs를 사용한 단방향 해시 암호화
- Salt를 이용한 추가 보안

### 토큰 기반 인증
- JWT (JSON Web Token) 사용
- 7일 만료 기한 설정 가능
- 로컬 스토리지에 안전하게 저장

### 입력값 검증
- express-validator를 사용한 서버 측 검증
- 클라이언트 측 HTML5 검증
- XSS 방지를 위한 HTML 이스케이핑

### 금칙어 필터링
- 메시지 전송 시 자동 필터링
- 관리자가 금칙어 추가/삭제 가능

## 📊 성능 최적화

- **30-40명 동시 접속 지원**
  - Socket.IO 룸 기반 브로드캐스팅
  - 메모리 효율적인 사용자 관리
  - 메시지 페이징 (최대 50개씩 로드)

- **모바일 최적화**
  - 반응형 CSS (320px 이상)
  - 터치 친화적 UI
  - 모바일 사파리/Chrome 지원

## 🚀 배포

### Render 배포 (추천)

1. **Render 계정 생성**
   - https://render.com 방문
   - GitHub 계정으로 로그인

2. **새 Web Service 생성**
   - "New" → "Web Service"
   - GitHub 저장소 연결
   - Build command: `npm install`
   - Start command: `npm start`

3. **환경 변수 설정**
   - 대시보드에서 "Environment" 탭
   - 필수 환경 변수 입력

4. **배포 완료**
   - 자동으로 배포 시작
   - 프로덕션 URL 제공

### Firebase Hosting 배포

1. **Firebase 프로젝트 생성**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. **Firestore 데이터베이스 설정**
   - Firebase Console에서 Firestore 활성화
   - 보안 규칙 설정

3. **배포**
   ```bash
   firebase deploy
   ```

## 🔄 업그레이드 계획

- [ ] Firebase Firestore 통합
- [ ] 파일/이미지 업로드
- [ ] 다이렉트 메시지 기능
- [ ] 음성 메시지
- [ ] 화상 통화
- [ ] 검색 기능
- [ ] 메시지 이모지 반응
- [ ] 메시지 인용

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 📞 문의

문제가 발생하면 [Issues](https://github.com/leowasd4267/Chat-website/issues)에 등록해주세요.

## 🎓 학습 자료

이 프로젝트에서 배운 내용:
- Node.js와 Express로 REST API 구축
- Socket.IO를 사용한 실시간 통신
- JWT를 사용한 사용자 인증
- 반응형 웹 디자인
- 데이터베이스 설계
- 보안 best practices

## 📝 변경 이력

### v1.0.0 (2024-01-15)
- 초기 버전 출시
- 기본 채팅 기능 구현
- 회원관리 기능 구현
- 반응형 UI 구현

---

**Made with ❤️ by leowasd4267**
