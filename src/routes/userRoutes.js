const express = require('express');
const bcrypt = require('bcrypt'); // bcrypt 라이브러리 임포트
const fs = require('fs'); // 파일 시스템 모듈 임포트
const path = require('path'); // 경로 모듈 임포트
const multer = require('multer'); // multer 모듈 임포트
const router = express.Router();

// JSON 파일 경로 설정
const dataFilePath = path.join(__dirname, '../data/users.json');

// multer 설정 (기존 경로에 저장)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'userUploads/'); // 파일 저장 경로
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // 확장자 포함
  },
});

const upload = multer({ storage }); // 설정된 스토리지 사용

// 이메일 형식 검증 함수
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 이메일 정규 표현식
  return re.test(String(email).toLowerCase());
};

// 기존 사용자 정보 로드 함수
const loadUsers = () => {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
  }
  return []; // 파일이 없으면 빈 배열 반환
};

// 사용자 정보 저장 함수
const saveUsers = (users) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2)); // JSON 파일로 저장
};

// 회원가입 엔드포인트
router.post('/', upload.single('profileImage'), async (req, res) => {
  try {
    // 요청 본문에서 데이터 추출
    const { email, password, passwordConfirm, nickname } = req.body;
    const profileImage = req.file ? req.file.path : null; // 프로필 이미지 경로 처리

    // 데이터 검증
    if (!email || !password || !passwordConfirm || !nickname) {
      return res.status(400).json({ error: '모든 필드를 입력해야 합니다.' });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ error: '유효한 이메일 주소를 입력해야 합니다.' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    const users = loadUsers(); // 기존 사용자 정보 로드
    const existingUserByEmail = users.find((user) => user.email === email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
    }

    const existingUserByNickname = users.find(
      (user) => user.nickname === nickname
    );
    if (existingUserByNickname) {
      return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10); // 10은 해시화 비용

    // 사용자 정보 저장
    const newUser = { email, password: hashedPassword, nickname, profileImage };
    users.push(newUser); // 더미 데이터 배열에 저장
    saveUsers(users); // 사용자 정보를 JSON 파일에 저장

    console.log('Received data:', req.body); // 수신된 데이터 로그 출력
    console.log('Current users:', users); // 현재 저장된 사용자 목록 로그 출력

    // 성공 응답
    res
      .status(201)
      .json({ message: 'User registered successfully.', user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 다른 사용자 관련 API 엔드포인트 추가 가능

module.exports = router;
