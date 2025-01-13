const express = require('express');
const fs = require('fs'); // 동기 메서드를 사용하는 fs 모듈
const fsPromises = require('fs').promises; // 비동기 메서드를 사용하는 fs.promises 모듈
const path = require('path');
const multer = require('multer'); // multer 모듈 불러오기
const router = express.Router();

// JSON 파일 경로 설정
const dataFilePath = path.join(__dirname, '../data/users.json');
const postsFilePath = path.join(__dirname, '../data/posts.json');

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

// 기존 사용자 정보 로드 함수 (비동기)
const loadUsers = async () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = await fsPromises.readFile(dataFilePath, 'utf8');
      return JSON.parse(data);
    }
    return []; // 파일이 없으면 빈 배열 반환
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

// 사용자 정보 저장 함수 (비동기)
const saveUsers = async (users) => {
  try {
    await fsPromises.writeFile(dataFilePath, JSON.stringify(users, null, 2)); // JSON 파일로 저장
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

// 기존 게시물 정보 로드 함수 (비동기)
const loadPosts = async () => {
  try {
    if (fs.existsSync(postsFilePath)) {
      const data = await fsPromises.readFile(postsFilePath, 'utf8');
      return JSON.parse(data);
    }
    return []; // 파일이 없으면 빈 배열 반환
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
};

// 게시물 정보 저장 함수 (비동기)
const savePosts = async (posts) => {
  try {
    await fsPromises.writeFile(postsFilePath, JSON.stringify(posts, null, 2)); // JSON 파일로 저장
  } catch (error) {
    console.error('Error saving posts:', error);
  }
};

// 닉네임 중복 검사 API
router.get('/check-nickname', async (req, res) => {
  const nickname = req.query.nickname;
  const users = await loadUsers(); // 비동기로 사용자 로드
  const isAvailable = !users.some((user) => user.nickname === nickname);
  res.json({ available: isAvailable });
});

// 사용자 정보 업데이트 API
router.put('/update', upload.single('profileImage'), async (req, res) => {
  const { email, nickname } = req.body; // 이메일과 닉네임을 클라이언트에서 받음
  const users = await loadUsers(); // 비동기로 사용자 로드

  const user = users.find((user) => user.email === email); // 현재 수정할 사용자 찾기

  if (user) {
    // 사용자 정보 업데이트
    user.nickname = nickname; // 닉네임 업데이트

    // 프로필 이미지 처리
    if (req.file) {
      const oldImagePath = path.join(
        __dirname,
        '../../userUploads',
        path.basename(user.profileImage)
      );

      // 기존 파일 삭제
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // 기존 이미지 파일 삭제
      }

      // 새로운 이미지 URL 업데이트
      user.profileImage = `userUploads/${req.file.filename}`; // 프로필 이미지
    }

    // 기존 게시물의 작성자 정보 업데이트
    const posts = await loadPosts(); // 비동기로 모든 게시물 로드
    let updatedPosts = false; // 업데이트 여부 플래그

    posts.forEach((post) => {
      if (post.author.email === email) {
        // 이메일로 작성자 찾기
        post.author.nickname = user.nickname; // 닉네임 변경
        post.author.profileImage = user.profileImage; // 프로필 이미지 변경
        updatedPosts = true; // 업데이트가 이루어졌음을 표시
      }

      // 댓글 작성자 정보 업데이트
      if (Array.isArray(post.comments)) {
        // comments가 배열인지 확인
        post.comments.forEach((comment) => {
          if (comment.author.email === email) {
            comment.author.nickname = user.nickname; // 닉네임 변경
            comment.author.profileImage = user.profileImage; // 프로필 이미지 변경
          }
        });
      }
    });

    // 게시물이 업데이트되었으면 저장
    if (updatedPosts) {
      await savePosts(posts); // 비동기로 변경된 게시물 목록 저장
    }

    await saveUsers(users); // 비동기로 사용자 정보 저장
    res.json({ message: '회원 정보가 수정되었습니다.', user });
  } else {
    res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  }
});

// 회원 탈퇴 API
router.delete('/delete', async (req, res) => {
  const { email } = req.body; // 클라이언트에서 이메일 받아오기
  const users = await loadUsers(); // 비동기로 사용자 로드
  const posts = await loadPosts(); // 비동기로 게시물 로드

  // 해당 이메일을 가진 사용자만 필터링
  const updatedUsers = users.filter((user) => user.email !== email);

  // 삭제된 사용자가 없는 경우
  if (users.length === updatedUsers.length) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  }

  // 탈퇴하는 사용자가 작성한 게시물 삭제
  const updatedPosts = posts.filter((post) => post.author.email !== email);

  // 게시물에서 댓글도 삭제
  updatedPosts.forEach((post) => {
    post.comments = post.comments.filter(
      (comment) => comment.author.email !== email
    );
  });

  await saveUsers(updatedUsers); // 비동기로 사용자 정보 저장
  await savePosts(updatedPosts); // 비동기로 게시물 정보 저장

  res.json({ message: '회원 탈퇴가 완료되었습니다.' });
});

// 모듈 내보내기
module.exports = router;
