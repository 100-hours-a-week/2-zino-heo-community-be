const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const userUpdateRoutes = require('./src/routes/userUpdateRoutes');
const userPasswordRoutes = require('./src/routes/userPasswordRoutes');
const boardCreateRoutes = require('./src/routes/boardCreateRoutes');
const boardReadRoutes = require('./src/routes/boardReadRoutes');

dotenv.config(); // 환경 변수 로드

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/userUploads', express.static(path.join(__dirname, 'userUploads')));
app.use('/boardUploads', express.static(path.join(__dirname, 'boardUploads')));

app.use('/api/users/register', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userUpdateRoutes);
app.use('/api/users/password', userPasswordRoutes);
app.use('/api/board/create', boardCreateRoutes);
app.use('/api/board', boardReadRoutes);

// 루트 경로에 대한 핸들러 추
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// 전역 오류 처리 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 서버 종료 처리
process.on('SIGINT', () => {
  console.log('Server is shutting down...');
  process.exit();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
