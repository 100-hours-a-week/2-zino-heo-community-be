const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt'); // bcrypt 모듈 불러오기
const router = express.Router();

// JSON 파일 경로 설정
const dataFilePath = path.join(__dirname, '../data/users.json');

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

// 비밀번호 수정 API
router.put('/update-password', async (req, res) => {
  const { email, password } = req.body; // 클라이언트에서 이메일과 비밀번호를 받음
  const users = loadUsers();

  const user = users.find((user) => user.email === email); // 이메일로 사용자 찾기

  if (user) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 해시화
      user.password = hashedPassword; // 해시된 비밀번호로 수정
      saveUsers(users); // 사용자 정보 저장
      return res.json({ message: '비밀번호가 수정되었습니다.' });
    } catch (error) {
      return res
        .status(500)
        .json({ message: '비밀번호 해시화 중 오류가 발생했습니다.' });
    }
  } else {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  }
});

// 모듈 내보내기
module.exports = router;
