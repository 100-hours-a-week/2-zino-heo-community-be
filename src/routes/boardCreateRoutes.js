const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { emit } = require('process');
const router = express.Router();

// JSON 파일 경로 설정
const dataFilePath = path.join(__dirname, '../data/posts.json');

// multer 설정 (파일 저장 설정)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'boardUploads/'); // 파일 저장 경로
  },
  filename: (req, file, cb) => {
    // 원래 파일 이름과 확장자를 사용하여 저장
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // 확장자 포함
  },
});

// multer 인스턴스 생성
const upload = multer({ storage: storage });

// 기존 게시글 정보 로드 함수
const loadPosts = () => {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
  }
  return []; // 파일이 없으면 빈 배열 반환
};

// 게시글 저장 함수
const savePosts = (posts) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(posts, null, 2));
};

// 게시글 작성 API
router.post('/', upload.single('image'), (req, res) => {
  const { title, content, authorEmail, authorNickname, authorProfileImage } =
    req.body;
  const posts = loadPosts();

  const newPost = {
    id: Date.now(),
    title,
    content,
    image: req.file ? req.file.path : null, // 이제 확장자가 포함된 경로
    createdAt: new Date().toISOString(), // 게시물 생성일
    author: {
      email: authorEmail,
      nickname: authorNickname,
      profileImage: authorProfileImage,
    },
    likes: [], // 기본 좋아요 수
    views: 0, // 기본 조회수
    comments: [], // 댓글 배열 초기화
  };

  posts.push(newPost);
  savePosts(posts);

  return res.json({ message: '게시글이 작성되었습니다.', post: newPost });
});

// 모듈 내보내기
module.exports = router;
