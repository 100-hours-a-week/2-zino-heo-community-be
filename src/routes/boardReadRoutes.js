const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const {
  getPosts,
  getCommentCountForPost,
  updateUserLastViewedPosts,
  incrementViewCount,
  deletePost,
  savePost,
  createComment,
  getCommentsByPostId,
  getCommentsForPost,
  updateComment,
  getUserByEmail,
  deleteComment,
  addLike,
  removeLike,
  getLikesForPost,
} = require('../../db'); // DB에서 사용자 조회 함수 가져오기

const VIEW_INTERVAL = 60 * 60 * 1000; // 1시간

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

// 모든 게시글 조회 API
router.get('/', async (req, res) => {
  try {
    const posts = await getPosts(); // 모든 게시글 가져오기
    const postsWithCommentsCount = await Promise.all(
      posts.map(async (post) => {
        const commentsCount = await getCommentCountForPost(post.id); // 댓글 수 조회
        return {
          id: post.id,
          title: post.title,
          likes: post.likeCount,
          views: post.views,
          comments: commentsCount,
          author: {
            nickname: post.author_nickname,
            profileImage: post.author_profileImage
              ? post.author_profileImage
              : 'https://dimg.donga.com/wps/ECONOMY/IMAGE/2018/10/18/92452237.2.jpg', // 기본 이미지 URL
          },
          createdAt: post.createdAt,
        };
      })
    );

    return res.json(postsWithCommentsCount); // 게시글과 댓글 수를 포함하여 응답
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// 특정 게시글 조회 API
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userEmail = req.session.user?.email; // 세션에서 사용자 이메일 가져오기

  // 모든 게시글 조회
  const posts = await getPosts(); // DB에서 모든 게시글 조회
  const post = posts.find((post) => post.id === parseInt(id)); // 특정 게시글 찾기

  if (!post) {
    return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  }

  // 댓글 목록 조회
  const comments = await getCommentsByPostId(id); // 게시글 ID로 댓글 목록 조회
  post.comments = comments;

  // 댓글 수 조회
  const commentsCount = await getCommentCountForPost(id); // 게시글 ID로 댓글 수 조회
  post.commentsCount = commentsCount; // 댓글 수 추가

  // 조회수 증가 로직
  if (userEmail) {
    const user = await getUserByEmail(userEmail); // DB에서 사용자 조회
    const currentTime = new Date().getTime();
    const lastViewedTime = user.lastViewedPosts?.[id]
      ? new Date(user.lastViewedPosts[id]).getTime()
      : 0;

    // 최소 조회 시간 검증
    if (currentTime - lastViewedTime < VIEW_INTERVAL) {
      return res
        .status(429)
        .json({ message: '1시간이 지나야 다시 조회할 수 있습니다.' });
    }

    // 조회수 증가
    await incrementViewCount(id); // 게시물 조회수 증가

    // 마지막 조회 시간 업데이트 (게시물별)
    if (!user.lastViewedPosts) {
      user.lastViewedPosts = {}; // 초기화
    }
    user.lastViewedPosts[id] = new Date().toISOString(); // 현재 시간으로 업데이트

    // DB에 사용자 정보 업데이트
    await updateUserLastViewedPosts(userEmail, user.lastViewedPosts); // 유저의 마지막 조회 시간 업데이트
  } else {
    await incrementViewCount(id); // 게시물 조회수 증가
    post.views += 1; // 로컬에서도 조회수 증가
  }

  return res.json(post);
}); // 조회 수 업데이트 최소 시간 수정해야 함

// 게시글 삭제 API
router.delete('/:id/delete', async (req, res) => {
  const { id } = req.params;

  // DB에서 모든 게시글 조회
  const posts = await getPosts();

  // 특정 게시글 찾기
  const postIndex = posts.findIndex((post) => post.id === parseInt(id));

  if (postIndex !== -1) {
    // 게시글 삭제
    await deletePost(id); // 기존 deletePost 함수 사용
    return res.json({ message: '게시글이 삭제되었습니다.' });
  } else {
    return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  }
});

// 게시글 좋아요 API
router.put('/:id/like', async (req, res) => {
  const { id } = req.params;

  // 세션에서 현재 사용자 이메일 가져오기
  const sessionUserEmail = req.session.user?.email;

  if (!sessionUserEmail) {
    return res.status(403).json({ message: '로그인 상태가 아닙니다.' });
  }

  const posts = await getPosts(); // 모든 게시글 로드
  const post = posts.find((post) => post.id === parseInt(id)); // 특정 게시글 찾기

  if (!post) {
    return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
  }

  // 특정 게시글의 좋아요 목록 가져오기
  const likes = await getLikesForPost(post.id); // 게시글의 좋아요 가져오기
  const userLiked = likes.includes(sessionUserEmail); // 사용자가 이미 좋아요를 눌렀는지 확인

  if (userLiked) {
    // 이미 좋아요를 눌렀다면 좋아요 취소
    await removeLike(sessionUserEmail, post.id); // 데이터베이스에서 좋아요 제거
  } else {
    // 좋아요 추가
    await addLike(sessionUserEmail, post.id); // 데이터베이스에 좋아요 추가
  }

  // 업데이트된 좋아요 수를 다시 가져오기
  const updatedLikes = await getLikesForPost(post.id); // 게시글의 좋아요 가져오기
  return res.json({ likes: updatedLikes.length }); // 좋아요 수 반환
});

// 댓글 작성 API
router.post('/:id/comments', async (req, res) => {
  const { id } = req.params;
  const newComment = req.body;

  // DB에서 게시글 조회
  const posts = await getPosts();
  const post = posts.find((post) => post.id === parseInt(id));

  if (!post) {
    return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
  }

  // 세션에서 현재 사용자 정보를 가져오기
  const sessionUser = req.session.user;

  if (!sessionUser) {
    return res.status(403).json({ message: '로그인 상태가 아닙니다.' });
  }

  // 댓글 작성자 정보 추가
  newComment.author = {
    email: sessionUser.email,
    nickname: sessionUser.nickname,
    profileImage: sessionUser.profileImage,
  };

  // 댓글을 DB에 추가
  await createComment(id, newComment); // 댓글 추가 함수 사용

  // 게시글의 댓글 목록 조회
  const comments = await getCommentsByPostId(id);

  return res.status(201).json({ comments }); // 추가된 댓글과 댓글 목록 반환
});

// 댓글 수정 API
router.patch('/:id/comments/:commentId', async (req, res) => {
  const { id, commentId } = req.params;
  const { content } = req.body;

  const posts = await getPosts(); // 모든 게시물 조회
  const post = posts.find((post) => post.id === parseInt(id));

  if (!post) {
    return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
  }

  // 게시글의 댓글 가져오기
  const comments = await getCommentsForPost(post.id);
  const comment = comments.find(
    (comment) => comment.id === parseInt(commentId)
  );

  if (!comment) {
    return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
  }

  // 세션에서 현재 사용자 정보를 가져오기
  const sessionUser = req.session.user;

  if (!sessionUser || sessionUser.email !== comment.author_email) {
    return res.status(403).json({ message: '권한이 없습니다.' });
  }

  // 댓글 내용 수정
  await updateComment(comment.id, content, post.id); // 댓글 업데이트
  comment.content = content; // 수정된 댓글 내용 반영

  return res.json(comment); // 수정된 댓글 반환
});

// 댓글 삭제 API
router.delete('/:id/comments/:commentId', async (req, res) => {
  const { id, commentId } = req.params;

  const posts = await getPosts(); // 모든 게시물 조회
  const post = posts.find((post) => post.id === parseInt(id));

  if (!post) {
    return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
  }

  // 게시글의 댓글 가져오기
  const comments = await getCommentsForPost(post.id);
  const commentIndex = comments.findIndex(
    (comment) => comment.id === parseInt(commentId)
  );

  if (commentIndex === -1) {
    return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
  }

  // 세션에서 현재 사용자 정보를 가져오기
  const sessionUser = req.session.user;

  if (
    !sessionUser ||
    sessionUser.email !== comments[commentIndex].author_email
  ) {
    return res.status(403).json({ message: '권한이 없습니다.' });
  }

  // 댓글 삭제
  await deleteComment(commentId); // 데이터베이스에서 댓글 삭제

  return res.status(204).send(); // 성공적으로 삭제
});

// 게시글 정보 가져오기
router.get('/:id/update', async (req, res) => {
  const { id } = req.params;

  // DB에서 모든 게시글 조회
  const posts = await getPosts();
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
    const posts = await getPosts(); // DB에서 모든 게시글 조회
    const postIndex = posts.findIndex((post) => post.id === parseInt(id)); // ID 확인

    if (postIndex === -1) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 세션에서 현재 사용자 정보를 가져오기
    const sessionUser = req.session.user;

    if (!sessionUser || sessionUser.email !== posts[postIndex].author_email) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    // 수정할 게시글 정보 업데이트
    const existingPost = posts[postIndex];

    // 게시글 수정
    const updatedPost = {
      ...existingPost,
      ...(title && { title }), // 제목이 제공된 경우에만 업데이트
      ...(content && { content }), // 내용이 제공된 경우에만 업데이트
      ...(image && { image }), // 이미지가 제공된 경우에만 업데이트
    };

    // DB에 수정된 게시글 저장
    await savePost(id, updatedPost); // updatePost 함수 사용

    return res.json(updatedPost); // 수정된 게시글 반환
  } catch (error) {
    console.error('게시글 수정 오류:', error);
    return res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

// 모듈 내보내기
module.exports = router;

//남은 작업 : 조회수 제한 시간 외에 자잘한 오류들, 기본 프로필 이미지 설정
