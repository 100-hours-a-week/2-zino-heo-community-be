const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt'); // bcrypt 모듈 불러오기
const router = express.Router();
const { getUserByEmail, updateUserPassword } = require('../../db'); // DB 관련 함수 가져오기

// 비밀번호 수정 API
router.put('/update-password', async (req, res) => {
  const { password } = req.body; // 클라이언트에서 비밀번호를 받음

  // 세션에서 현재 사용자 이메일 가져오기
  const sessionUserEmail = req.session.user?.email;

  if (!sessionUserEmail) {
    return res.status(403).json({ message: '로그인 상태가 아닙니다.' });
  }

  try {
    const user = await getUserByEmail(sessionUserEmail); // DB에서 사용자 정보 가져오기

    if (user) {
      const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 해시화
      await updateUserPassword(sessionUserEmail, hashedPassword); // 해시된 비밀번호로 수정

      return res.json({ message: '비밀번호가 수정되었습니다.' });
    } else {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: '오류가 발생했습니다: ' + error.message });
  }
});

// 모듈 내보내기
module.exports = router;
