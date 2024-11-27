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
  return []; // 파일이 없으면 빈 배열 반환
};

// 모든 게시글 조회 API
router.get('/', (req, res) => {
  const posts = loadPosts();
  return res.json(
    posts.map((post) => ({
      id: post.id,
      title: post.title,
      likes: post.likes,
      views: post.views,
      comments: post.comments.length, // 댓글 수
      author: {
        nickname: post.author.nickname,
        profileImage: post.author.profileImage,
      },
      createdAt: post.createdAt,
    }))
  );
});

// 특정 게시글 조회 API
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const posts = loadPosts();
  const post = posts.find((post) => post.id === parseInt(id));

  if (post) {
    // 조회수 증가
    post.views += 1;
    savePosts(posts); // 수정된 게시글 저장

    return res.json({
      title: post.title,
      content: post.content,
      image: post.image,
      likes: post.likes,
      views: post.views,
      comments: post.comments.length, // 댓글 수
      createdAt: post.createdAt,
      author: post.author,
      commentList: post.comments, // 댓글 정보
    });
  } else {
    return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  }
});

// 모듈 내보내기
module.exports = router;
