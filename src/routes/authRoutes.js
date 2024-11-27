const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dataFilePath = path.join(__dirname, '../data/users.json');

// 기존 사용자 정보 로드 함수
const loadUsers = () => {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
  }
  return []; // 파일이 없으면 빈 배열 반환
};

// 로그인 엔드포인트
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일과 비밀번호가 제공되었는지 확인
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: '이메일과 비밀번호를 입력해야 합니다.' });
    }

    const users = loadUsers(); // 사용자 정보 로드
    const user = users.find((user) => user.email === email); // 이메일로 사용자 검색

    // 사용자 존재 여부 확인
    if (!user) {
      return res
        .status(401)
        .json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // 로그인 성공 시 사용자 정보를 반환
    res.status(200).json({
      message: '로그인 성공',
      user: {
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage, // 프로필 이미지 포함
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
