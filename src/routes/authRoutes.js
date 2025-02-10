const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { getUserByEmail } = require('../../db'); // DB에서 사용자 조회 함수 가져오기

// 로그인 엔드포인트
router.post('/login', async (req, res) => {
  console.log('세션 시작:', req.session);
  try {
    const { email, password } = req.body;

    // 이메일과 비밀번호가 제공되었는지 확인
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: '이메일과 비밀번호를 입력해야 합니다.' });
    }

    // DB에서 사용자 정보 조회
    const user = await getUserByEmail(email);

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

    // 로그인 성공 시 사용자 정보를 세션에 저장
    req.session.user = {
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage, // 프로필 이미지 포함
    };
    console.log('로그인 후 세션 정보:', req.session.user); // 세션 정보 로그

    // 로그인 성공 메시지 및 사용자 정보 반환
    res.status(200).json({
      message: '로그인 성공',
      user: req.session.user, // 세션에 저장된 사용자 정보 반환
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
