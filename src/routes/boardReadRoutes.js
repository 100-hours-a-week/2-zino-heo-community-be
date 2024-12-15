const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();

// JSON 파일 경로 설정
const dataFilePath = path.join(__dirname, '../data/posts.json');

// multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'boardUploads'); // 이미지 파일이 저장될 경로
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // 파일 이름
  },
});

const upload = multer({ storage }); // multer 인스턴스 생성

// 게시글 저장 함수
const savePosts = (posts) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(posts, null, 2)); // JSON 형식으로 저장
};

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
      likes: post.likes.length,
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

    return res.json(post);
  } else {
    return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  }
});

// 게시글 삭제 API
router.delete('/:id/delete', (req, res) => {
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

router.put('/:id/like', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  const posts = loadPosts(); // 모든 게시글 로드
  const post = posts.find((post) => post.id === parseInt(id)); // 특정 게시글 찾기

  if (!post) {
    return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
  }

  // likes 필드가 배열인지 확인하고 초기화
  if (!Array.isArray(post.likes)) {
    post.likes = []; // likes 필드가 배열이 아니면 빈 배열로 초기화
  }

  // 사용자가 이미 좋아요를 눌렀는지 확인
  if (post.likes.includes(email)) {
    // 이미 좋아요를 눌렀다면 좋아요 취소
    post.likes = post.likes.filter((userEmail) => userEmail !== email); // 사용자 이메일 제거
  } else {
    // 좋아요 추가
    post.likes.push(email); // 사용자 이메일 추가
  }

  savePosts(posts); // 수정된 게시글 저장
  return res.json({ likes: post.likes.length }); // 좋아요 수 반환
});

router.post('/:id/comments', (req, res) => {
  const { id } = req.params;
  const newComment = req.body;

  const posts = loadPosts();
  const post = posts.find((post) => post.id === parseInt(id));

  if (!post) {
    return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
  }

  // 댓글을 게시물의 comments 배열에 추가
  post.comments.push(newComment);
  savePosts(posts); // 게시물 저장

  return res.status(201).json(newComment); // 추가된 댓글 반환
});

router.patch('/:id/comments/:commentId', (req, res) => {
  const { id, commentId } = req.params;
  const { content } = req.body;

  const posts = loadPosts();
  const post = posts.find((post) => post.id === parseInt(id));

  if (!post) {
    return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
  }

  const comment = post.comments.find(
    (comment) => comment.id === parseInt(commentId)
  );

  if (!comment) {
    return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
  }

  comment.content = content; // 댓글 내용 수정
  savePosts(posts); // 게시물 저장

  return res.json(comment); // 수정된 댓글 반환
});

router.delete('/:id/comments/:commentId', (req, res) => {
  const { id, commentId } = req.params;

  const posts = loadPosts();
  const post = posts.find((post) => post.id === parseInt(id));

  if (!post) {
    return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
  }

  const commentIndex = post.comments.findIndex(
    (comment) => comment.id === parseInt(commentId)
  );

  if (commentIndex === -1) {
    return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
  }

  post.comments.splice(commentIndex, 1); // 댓글 삭제
  savePosts(posts); // 게시물 저장

  return res.status(204).send(); // 성공적으로 삭제
});

// 게시글 정보 가져오기
router.get('/:id/update', async (req, res) => {
  const { id } = req.params;
  const posts = loadPosts();
  const post = posts.find((post) => post.id === parseInt(id));

  if (post) {
    return res.json(post);
  } else {
    return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  }
});

// 게시글 수정 API (PATCH 요청)
router.patch('/:id/postupdate', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  let image;

  if (req.file) {
    image = req.file.path; // 업로드된 이미지 경로
  }

  try {
    const posts = loadPosts(); // 모든 게시글 로드
    const postIndex = posts.findIndex((post) => post.id === parseInt(id)); // ID 확인

    if (postIndex === -1) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 수정할 게시글 정보 업데이트
    const existingPost = posts[postIndex];

    posts[postIndex] = {
      ...existingPost,
      ...(title && { title }), // 제목이 제공된 경우에만 업데이트
      ...(content && { content }), // 내용이 제공된 경우에만 업데이트
      ...(image && { image }), // 이미지가 제공된 경우에만 업데이트
    };

    savePosts(posts); // 수정된 게시글 저장
    return res.json(posts[postIndex]); // 수정된 게시글 반환
  } catch (error) {
    console.error('게시글 수정 오류:', error);
    return res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

// 모듈 내보내기
module.exports = router;
