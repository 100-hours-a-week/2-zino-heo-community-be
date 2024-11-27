const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();

// JSON 파일 경로 설정
const dataFilePath = path.join(__dirname, '../data/posts.json');

// multer 설정 (이미지 업로드 시 사용)
const upload = multer({ dest: 'uploads/' });

// 기존 게시글 정보 로드 함수
const loadPosts = () => {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
  }
  return [];
};

// 게시글 수정 API
router.put('/update/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const posts = loadPosts();

  const postIndex = posts.findIndex((post) => post.id === parseInt(id));

  if (postIndex !== -1) {
    posts[postIndex].title = title;
    posts[postIndex].content = content;
    if (req.file) {
      posts[postIndex].image = req.file.path; // 이미지 업데이트
    }
    savePosts(posts); // 수정된 게시글 저장
    return res.json({
      message: '게시글이 수정되었습니다.',
      post: posts[postIndex],
    });
  } else {
    return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  }
});

// 모듈 내보내기
module.exports = router;

// 게시글 저장 함수
const savePosts = (posts) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(posts, null, 2));
};
