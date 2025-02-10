const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const { createPost } = require('../../db'); // DB에 게시글 저장 함수 가져오기

// multer 설정 (파일 저장 설정)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'boardUploads/'); // 파일 저장 경로
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // 확장자 포함
  },
});

// multer 인스턴스 생성
const upload = multer({ storage: storage });

// 게시글 작성 API
router.post('/', upload.single('image'), async (req, res) => {
  const { title, content } = req.body;

  // 세션에서 현재 사용자 정보를 가져오기
  const sessionUser = req.session.user;

  if (!sessionUser) {
    return res.status(403).json({ message: '로그인 상태가 아닙니다.' });
  }

  const { email, nickname, profileImage } = sessionUser; // 세션에서 사용자 정보 추출

  const newPost = {
    id: Date.now(), // 데이터베이스에서는 자동 생성될 ID 사용
    title,
    content,
    image: req.file ? req.file.path : null, // 이제 확장자가 포함된 경로
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '), // 게시물 생성일
    author: {
      email, // 세션에서 가져온 이메일
      nickname, // 세션에서 가져온 닉네임
      profileImage, // 세션에서 가져온 프로필 이미지
    },
    likes: 0, // 기본 좋아요 수
    views: 0, // 기본 조회수
  };

  try {
    // DB에 게시글 저장
    await createPost(newPost);
    return res.json({ message: '게시글이 작성되었습니다.', post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    return res
      .status(500)
      .json({ message: '게시글 작성 중 오류가 발생했습니다.' });
  }
});

// 모듈 내보내기
module.exports = router;
