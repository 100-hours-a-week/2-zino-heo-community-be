const express = require('express');
const bcrypt = require('bcrypt'); // bcrypt 라이브러리 임포트
const fs = require('fs'); // 파일 시스템 모듈 임포트
const path = require('path'); // 경로 모듈 임포트
const multer = require('multer'); // multer 모듈 임포트
const router = express.Router();
const { createUser, getUserByEmail, getUserByNickname } = require('../../db'); // DB 관련 함수 가져오기

// multer 설정 (기존 경로에 저장)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'userUploads/';

    // 디렉토리가 존재하지 않으면 생성
    fs.access(uploadDir, (error) => {
      if (error) {
        fs.mkdir(uploadDir, { recursive: true }, (err) => {
          if (err) {
            return cb(err); // 디렉토리 생성 중 오류 발생
          }
          cb(null, uploadDir); // 디렉토리 생성 후 경로 반환
        });
      } else {
        cb(null, uploadDir); // 디렉토리가 이미 존재하면 경로 반환
      }
    });
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

    // DB에서 사용자 중복 검사
    const existingUserByEmail = await getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
    }

    const existingUserByNickname = await getUserByNickname(nickname);
    if (existingUserByNickname) {
      return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10); // 10은 해시화 비용

    // 사용자 정보 저장
    const newUser = { email, password: hashedPassword, nickname, profileImage };
    await createUser(newUser); // DB에 사용자 정보 저장

    console.log('Received data:', req.body); // 수신된 데이터 로그 출력

    // 성공 응답
    res
      .status(201)
      .json({ message: 'User registered successfully.', user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 모듈 내보내기
module.exports = router;
