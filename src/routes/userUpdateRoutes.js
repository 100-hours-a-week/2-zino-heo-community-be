const express = require('express');
const fs = require('fs'); // 동기 메서드를 사용하는 fs 모듈
const fsPromises = require('fs').promises; // 비동기 메서드를 사용하는 fs.promises 모듈
const path = require('path');
const multer = require('multer'); // multer 모듈 불러오기
const router = express.Router();

const {
  getUserByEmail,
  updateUser,
  deleteUser,
  getPosts,
  updatePosts,
  getAllComments,
  saveComment,
  deleteCommentsByUserEmail,
  getUserByNickname,
} = require('../../db'); // DB 관련 함수 가져오기

// multer 설정 (기존 경로에 저장)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'userUploads/'); // 파일 저장 경로
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // 확장자 포함
  },
});

const upload = multer({ storage }); // 설정된 스토리지 사용

// 닉네임 중복 검사 API
router.get('/check-nickname', async (req, res) => {
  const nickname = req.query.nickname; // 쿼리로 닉네임 받기
  const user = await getUserByNickname(nickname); // 닉네임으로 사용자 검사
  const isAvailable = !user; // 중복 여부 확인
  res.json({ available: isAvailable }); // 중복 여부 반환
});

// 사용자 정보 업데이트 API
router.put('/update', upload.single('profileImage'), async (req, res) => {
  const { email, nickname } = req.body; // 이메일과 닉네임을 클라이언트에서 받음
  const sessionUserEmail = req.session.user?.email; // 세션에서 이메일 가져오기

  // 세션에서 가져온 이메일과 요청의 이메일이 일치하는지 확인
  if (sessionUserEmail !== email) {
    return res.status(403).json({ message: '권한이 없습니다.' });
  }

  const user = await getUserByEmail(email); // DB에서 현재 수정할 사용자 찾기

  if (user) {
    // 사용자 정보 업데이트
    user.nickname = nickname; // 닉네임 업데이트

    // 프로필 이미지 처리
    if (req.file) {
      // user.profileImage가 유효한지 확인
      if (user.profileImage) {
        const oldImagePath = path.join(
          __dirname,
          '../../userUploads',
          path.basename(user.profileImage) // user.profileImage가 null이 아닐 경우만 처리
        );

        // 기존 파일 삭제
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath); // 기존 이미지 파일 삭제
            console.log(
              '기존 이미지 파일이 성공적으로 삭제되었습니다:',
              path.basename(oldImagePath)
            );
          } catch (err) {
            console.error('기존 이미지 파일 삭제 중 오류 발생:', err);
          }
        } else {
          console.log('삭제할 기존 이미지 파일이 없습니다.');
        }
      } else {
        console.log(
          '사용자 프로필 이미지가 없습니다. 새 이미지를 업로드합니다.'
        );
      }

      // 새로운 이미지 URL 업데이트
      user.profileImage = `userUploads/${req.file.filename}`; // 프로필 이미지 업데이트
    }

    // DB에 업데이트된 사용자 정보 저장
    await updateUser(email, user.nickname, user.profileImage);

    // 댓글 정보 업데이트
    const comments = await getAllComments();

    for (const comment of comments) {
      if (comment.author_email === email) {
        comment.author_nickname = user.nickname; // 닉네임 변경
        comment.author_profile_image = user.profileImage; // 프로필 이미지 변경
        await saveComment(
          comment.id,
          comment.author_nickname,
          comment.author_profile_image
        ); // 댓글 업데이트
      }
    }

    // 게시물과 댓글 작성자 정보 업데이트
    const posts = await getPosts(); // 모든 게시물 로드

    posts.forEach((post) => {
      if (post.author_email === email) {
        // 이메일로 작성자 찾기
        post.author_nickname = user.nickname; // 닉네임 변경
        post.author_profileImage = user.profileImage; // 프로필 이미지 변경
      }
    });

    // 변경된 게시물 목록을 DB에 저장
    await updatePosts(posts); // 비동기로 변경된 게시물 목록 저장

    res.json({ message: '회원 정보가 수정되었습니다.', user });
  } else {
    res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  }
});

// 회원 탈퇴 API
router.delete('/delete', async (req, res) => {
  const sessionUserEmail = req.session.user?.email; // 세션에서 이메일 가져오기
  const { email } = req.body; // 클라이언트에서 이메일 받아오기

  // 세션에서 가져온 이메일과 요청의 이메일이 일치하는지 확인
  if (sessionUserEmail !== email) {
    return res.status(403).json({ message: '권한이 없습니다.' });
  }

  const user = await getUserByEmail(email); // DB에서 사용자 정보 로드
  if (!user) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  }

  // 사용자가 작성한 댓글 삭제
  await deleteCommentsByUserEmail(email); // 댓글 삭제

  // DB에서 사용자 삭제
  await deleteUser(email); // 사용자 삭제

  res.json({ message: '회원 탈퇴가 완료되었습니다.' });
});

// 로그아웃 API
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: '로그아웃 중 오류가 발생했습니다.' });
    }
    res.clearCookie('user'); // 쿠키 삭제
    res.json({ message: '로그아웃이 완료되었습니다.' });
  });
});

// 모듈 내보내기
module.exports = router;
