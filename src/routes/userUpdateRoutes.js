const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // multer 모듈 불러오기
const router = express.Router();

// JSON 파일 경로 설정
const dataFilePath = path.join(__dirname, '../data/users.json');

// 기존의 /userUploads/ 경로 사용
const uploadDir = path.join(__dirname, '../../userUploads'); // 이 경로는 실제 경로에 맞게 조정 필요

// multer 설정 (기존 경로에 저장)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // 업로드할 디렉토리
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // 파일 이름 설정
  },
});

const upload = multer({ storage }); // 설정된 스토리지 사용

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

// 닉네임 중복 검사 API
router.get('/check-nickname', (req, res) => {
  const nickname = req.query.nickname;
  const users = loadUsers();
  const isAvailable = !users.some((user) => user.nickname === nickname);
  res.json({ available: isAvailable });
});

// 사용자 정보 업데이트 API
router.put('/update', upload.single('profileImage'), (req, res) => {
  console.log('Received request:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Uploaded file:', req.file);

  const { email, nickname } = req.body; // 이메일과 닉네임을 클라이언트에서 받음
  const users = loadUsers();
  console.log('Loaded users:', users);

  const user = users.find((user) => user.email === email);
  console.log('Searching for email:', email);

  if (user) {
    // 사용자 정보 업데이트
    user.nickname = nickname; // 닉네임 업데이트

    // 프로필 이미지 처리
    if (req.file) {
      // 기존 프로필 이미지 경로
      const oldImagePath = path.join(
        __dirname,
        '../../userUploads',
        path.basename(user.profileImage)
      );

      // 기존 파일 삭제
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // 기존 이미지 파일 삭제
      }

      // 새로운 이미지 URL 업데이트
      user.profileImage = `userUploads/${req.file.filename}`; // 프로필 이미지
    }

    saveUsers(users); // 사용자 정보 저장
    res.json({ message: '회원 정보가 수정되었습니다.', user });
  } else {
    res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  }
});

// 회원 탈퇴 API
router.delete('/delete', (req, res) => {
  const { email } = req.body; // 클라이언트에서 이메일 받아오기
  const users = loadUsers();

  // 해당 이메일을 가진 사용자만 필터링
  const updatedUsers = users.filter((user) => user.email !== email);

  // 삭제된 사용자가 없는 경우
  if (users.length === updatedUsers.length) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  }

  saveUsers(updatedUsers); // 사용자 정보 저장
  res.json({ message: '회원 탈퇴가 완료되었습니다.' });
});

// 모듈 내보내기
module.exports = router;
