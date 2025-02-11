const express = require('express');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const userUpdateRoutes = require('./src/routes/userUpdateRoutes');
const userPasswordRoutes = require('./src/routes/userPasswordRoutes');
const boardCreateRoutes = require('./src/routes/boardCreateRoutes');
const boardReadRoutes = require('./src/routes/boardReadRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');

dotenv.config(); // 환경 변수 로드

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
const corsOptions = {
  origin: 'http://localhost:8080', // 허용할 도메인
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메서드
  credentials: true, // 쿠키를 포함할 수 있도록 설정
};

app.use(cors(corsOptions)); // CORS 설정을 먼저 적용

// 세션 미들웨어 설정 (CORS 설정 다음에 위치)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'cometrue', // 비밀 키
    resave: false, // 세션이 변경되지 않아도 저장할지 여부
    saveUninitialized: false, // 초기화되지 않은 세션도 저장할지 여부
    cookie: {
      maxAge: 30 * 60 * 1000, // 쿠키 만료 시간 설정 (30분)
      httpOnly: true, // 클라이언트 JavaScript에서 쿠키에 접근할 수 없도록 설정
      secure: false, // 로컬 환경에서는 false로 설정
      sameSite: 'Lax', // 크로스 오리진 쿠키를 허용
    },
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/userUploads', express.static(path.join(__dirname, 'userUploads')));
app.use('/boardUploads', express.static(path.join(__dirname, 'boardUploads')));

// 라우트 설정
app.use('/api/users/register', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userUpdateRoutes);
app.use('/api/users/password', userPasswordRoutes);
app.use('/api/board/create', boardCreateRoutes);
app.use('/api/board', boardReadRoutes);
app.use('/api/user/session', sessionRoutes);

// 루트 경로에 대한 핸들러 추가
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// 전역 오류 처리 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 사용자 정보를 반환하는 엔드포인트
app.get('/api/user/session', (req, res) => {
  if (req.session.user) {
    return res.status(200).json(req.session.user);
  } else {
    return res.status(401).json({ error: '사용자가 인증되지 않았습니다.' });
  }
});

// 서버 종료 처리
process.on('SIGINT', () => {
  console.log('Server is shutting down...');
  process.exit();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
