const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();

// JSON 파일 경로 설정
const dataFilePath = path.join(__dirname, '../data/posts.json');

// multer 설정
const upload = multer({ dest: 'boardUploads/' });

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
  const { title, content, authorNickname, authorProfileImage } = req.body;
  const posts = loadPosts();

  const newPost = {
    id: posts.length + 1,
    title,
    content,
    image: req.file ? req.file.path : null,
    createdAt: new Date().toISOString(), // 게시물 생성일
    author: {
      nickname: authorNickname,
      profileImage: authorProfileImage,
    },
    likes: 0, // 기본 좋아요 수
    views: 0, // 기본 조회수
    comments: [], // 댓글 배열 초기화
  };

  posts.push(newPost);
  savePosts(posts);

  return res.json({ message: '게시글이 작성되었습니다.', post: newPost });
});

// 모듈 내보내기
module.exports = router;
