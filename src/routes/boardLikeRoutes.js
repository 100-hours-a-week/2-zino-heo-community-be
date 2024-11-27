const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// JSON 파일 경로 설정
const dataFilePath = path.join(__dirname, '../data/posts.json');

// 기존 게시글 정보 로드 함수
const loadPosts = () => {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
  }
  return [];
};

// 게시글 좋아요 API
router.put('/like/:id', (req, res) => {
  const { id } = req.params;
  const posts = loadPosts();
  const post = posts.find((post) => post.id === parseInt(id));

  if (post) {
    post.likes += 1; // 좋아요 수 증가
    savePosts(posts); // 수정된 게시글 저장
    return res.json({ message: '좋아요가 추가되었습니다.', likes: post.likes });
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
