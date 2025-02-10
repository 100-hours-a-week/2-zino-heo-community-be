const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { getUserByEmail, updateUser } = require('../../db'); // DB 관련 함수 가져오기

// 사용자 정보 반환 엔드포인트
router.get('/', (req, res) => {
  if (req.session.user) {
    return res.status(200).json(req.session.user);
  } else {
    return res.status(401).json({ error: '사용자가 인증되지 않았습니다.' });
  }
});

// 사용자 정보 업데이트 엔드포인트
router.put('/update', async (req, res) => {
  const { nickname, profileImage } = req.body;

  // 세션에서 사용자 정보 확인
  if (!req.session.user) {
    return res.status(401).json({ error: '사용자가 인증되지 않았습니다.' });
  }

  const email = req.session.user.email; // 세션에서 이메일 가져오기
  const user = await getUserByEmail(email); // DB에서 사용자 정보 로드

  // 사용자가 존재하는지 확인
  if (!user) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }

  // 사용자 정보 업데이트
  if (nickname) {
    user.nickname = nickname;
    req.session.user.nickname = nickname; // 세션 정보 업데이트
  }
  if (profileImage) {
    user.profileImage = profileImage;
    req.session.user.profileImage = profileImage; // 세션 정보 업데이트
  }

  // DB에 업데이트된 사용자 정보 저장
  await updateUser(email, user.nickname, user.profileImage);

  // 성공적인 응답 반환
  res.status(200).json({
    message: '사용자 정보가 성공적으로 업데이트되었습니다.',
    user: req.session.user, // 업데이트된 사용자 정보 반환
  });
});

module.exports = router;
