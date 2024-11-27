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

// 게시글 삭제 API
router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  const posts = loadPosts();

  const postIndex = posts.findIndex((post) => post.id === parseInt(id));

  if (postIndex !== -1) {
    posts.splice(postIndex, 1); // 게시글 삭제
    savePosts(posts);
    return res.json({ message: '게시글이 삭제되었습니다.' });
  } else {
    return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  }
});

// 모듈 내보내기
module.exports = router;
