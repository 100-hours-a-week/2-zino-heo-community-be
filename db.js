const mysql = require('mysql2/promise'); // Promise 기반 MySQL2 모듈
require('dotenv').config();

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 게시글 생성 함수
const createPost = async (post) => {
  const sql =
    'INSERT INTO posts (id, title, content, image, createdAt, author_email, author_nickname, author_profileImage, views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const [results] = await pool.query(sql, [
    post.id,
    post.title,
    post.content,
    post.image,
    post.createdAt,
    post.author.email,
    post.author.nickname,
    post.author.profileImage,
    post.views,
  ]);
  return results.insertId; // 추가된 게시글의 ID 반환
};

const getPosts = async () => {
  const sql = 'SELECT * FROM posts'; // 모든 게시물 조회
  const [posts] = await pool.query(sql);

  // 각 게시물의 좋아요 수를 추가
  for (const post of posts) {
    post.likeCount = await getLikeCountForPost(post.id);
  }

  return posts; // 결과 반환
};

// 게시글 업데이트 함수
const updatePosts = async (posts) => {
  return Promise.all(
    posts.map(async (post) => {
      const sql = `
      INSERT INTO posts (id, title, content, image, createdAt, author_email, author_nickname, author_profileImage, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        id = VALUES(id), title = VALUES(title), content = VALUES(content), image = VALUES(image),
        author_nickname = VALUES(author_nickname), author_profileImage = VALUES(author_profileImage),
        views = VALUES(views);`;

      const [results] = await pool.query(sql, [
        post.id,
        post.title,
        post.content,
        post.image,
        post.createdAt,
        post.author_email,
        post.author_nickname,
        post.author_profileImage,
        post.views,
      ]);
      return results;
    })
  );
};

// 게시글 삭제 함수
const deletePost = async (id) => {
  const sql = 'DELETE FROM posts WHERE id = ?';
  const [results] = await pool.query(sql, [id]);
  console.log('Post deleted: ', results.affectedRows);
};

// 사용자 생성 함수
const createUser = async (user) => {
  const sql =
    'INSERT INTO users (email, password, nickname, profileImage) VALUES (?, ?, ?, ?)';
  const [results] = await pool.query(sql, [
    user.email,
    user.password,
    user.nickname,
    user.profileImage,
  ]);
  return results.insertId; // 추가된 사용자의 ID 반환
};

// 사용자 업데이트 함수
const updateUser = async (email, newNickname, newProfileImage) => {
  const sql = 'UPDATE users SET nickname = ?, profileImage = ? WHERE email = ?';
  const [results] = await pool.query(sql, [
    newNickname,
    newProfileImage,
    email,
  ]);
  console.log('User updated: ', results.affectedRows);
};

// 사용자 삭제 함수
const deleteUser = async (email) => {
  const sql = 'DELETE FROM users WHERE email = ?';
  const [results] = await pool.query(sql, [email]);
  console.log('User deleted: ', results.affectedRows);
};

// 댓글 생성 함수
const createComment = async (postId, comment) => {
  const sql =
    'INSERT INTO comments (post_id, content, author_email, author_nickname, author_profile_image, createdAt) VALUES (?, ?, ?, ?, ?, ?)';

  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.query(sql, [
    postId,
    comment.content,
    comment.author.email,
    comment.author.nickname,
    comment.author.profileImage,
    createdAt,
  ]);
};

// 댓글 업데이트 함수
const updateComment = async (commentId, newContent, postId) => {
  const sql = 'UPDATE comments SET content = ? WHERE id = ? AND post_id = ?';
  const [results] = await pool.query(sql, [newContent, commentId, postId]);
  console.log('Comment updated: ', results.affectedRows);
  return results.affectedRows; // 업데이트된 행 수 반환
};

// 댓글 삭제 함수
const deleteComment = async (id) => {
  const sql = 'DELETE FROM comments WHERE id = ?';
  const [results] = await pool.query(sql, [id]);
  console.log('Comment deleted: ', results.affectedRows);
};

// 좋아요 추가 함수
const addLike = async (userEmail, postId) => {
  const sql = 'INSERT INTO likes (user_email, post_id) VALUES (?, ?)';
  const [results] = await pool.query(sql, [userEmail, postId]);
  console.log('Like added: ', results.insertId);
  return results.insertId; // 추가된 좋아요 ID 반환
};

// 좋아요 제거 함수
const removeLike = async (userEmail, postId) => {
  const sql = 'DELETE FROM likes WHERE user_email = ? AND post_id = ?';
  const [results] = await pool.query(sql, [userEmail, postId]);
  console.log('Like removed: ', results.affectedRows);
  return results.affectedRows; // 삭제된 행 수 반환
};

// 조회수 증가 함수
const incrementViewCount = async (postId) => {
  const sql = 'UPDATE posts SET views = views + 1 WHERE id = ?';
  const [results] = await pool.query(sql, [postId]);
  console.log('View count incremented: ', results.affectedRows);
};

// 이메일로 사용자 조회 함수
const getUserByEmail = async (email) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const [results] = await pool.query(sql, [email]);
  return results[0]; // 결과에서 첫 번째 사용자 반환
};

// 닉네임으로 사용자 조회 함수
const getUserByNickname = async (nickname) => {
  const sql = 'SELECT * FROM users WHERE nickname = ?';
  const [results] = await pool.query(sql, [nickname]);
  return results[0]; // 결과에서 첫 번째 사용자 반환
};

// 비밀번호 업데이트 함수
const updateUserPassword = async (email, newPassword) => {
  const sql = 'UPDATE users SET password = ? WHERE email = ?';
  const [results] = await pool.query(sql, [newPassword, email]);
  return results.affectedRows; // 수정된 행 수 반환
};

// 댓글 수 조회 함수
const getCommentCountForPost = async (postId) => {
  const [result] = await pool.query(
    'SELECT COUNT(*) AS count FROM comments WHERE post_id = ?',
    [postId]
  );
  return result[0].count; // 댓글 수 반환
};

// 특정 게시글의 댓글 가져오기 함수
const getCommentsForPost = async (postId) => {
  const [comments] = await pool.query(
    'SELECT * FROM comments WHERE post_id = ?',
    [postId]
  );
  return comments; // 댓글 배열 반환
};

const updateUserLastViewedPosts = async (email, lastViewedPosts) => {
  const sql = 'UPDATE users SET lastViewedPosts = ? WHERE email = ?';
  await pool.query(sql, [JSON.stringify(lastViewedPosts), email]);
};

const savePost = async (id, updatedPost) => {
  const sql = 'UPDATE posts SET title = ?, content = ?, image = ? WHERE id = ?';
  await pool.query(sql, [
    updatedPost.title,
    updatedPost.content,
    updatedPost.image,
    id,
  ]);
};

const getCommentsByPostId = async (postId) => {
  const sql = 'SELECT * FROM comments WHERE post_id = ?';
  const [rows] = await pool.query(sql, [postId]);
  return rows; // 댓글 목록 반환
};

// 모든 댓글 가져오는 함수
const getAllComments = async () => {
  const sql = 'SELECT * FROM comments'; // 모든 댓글 조회
  const [results] = await pool.query(sql);
  return results; // 결과 반환
};

// 댓글 업데이트 함수
const saveComment = async (commentId, newNickname, newProfileImage) => {
  const sql =
    'UPDATE comments SET author_nickname = ?, author_profile_image = ? WHERE id = ?';
  const [results] = await pool.query(sql, [
    newNickname,
    newProfileImage,
    commentId,
  ]);
  console.log('Comment updated: ', results.affectedRows);
  return results.affectedRows; // 업데이트된 행 수 반환
};

// 특정 게시글의 좋아요를 조회하는 함수
const getLikesForPost = async (postId) => {
  const sql = 'SELECT user_email FROM likes WHERE post_id = ?'; // 좋아요 조회 쿼리
  const [rows] = await pool.query(sql, [postId]); // DB 쿼리 실행
  return rows.map((row) => row.user_email); // 이메일 배열 반환
};

// 특정 게시물의 좋아요 수를 조회하는 함수
const getLikeCountForPost = async (postId) => {
  const sql = 'SELECT COUNT(*) AS count FROM likes WHERE post_id = ?'; // 좋아요 수 조회 쿼리
  const [rows] = await pool.query(sql, [postId]); // DB 쿼리 실행
  return rows[0].count; // 좋아요 수 반환
};

// 특정 사용자가 작성한 댓글 삭제 함수
const deleteCommentsByUserEmail = async (userEmail) => {
  const sql = 'DELETE FROM comments WHERE author_email = ?'; // 댓글 삭제 쿼리
  await pool.query(sql, [userEmail]); // DB 쿼리 실행
};

module.exports = {
  pool, // 연결 풀 내보내기
  createPost,
  getPosts,
  updatePosts,
  deletePost,
  createUser,
  updateUser,
  deleteUser,
  createComment,
  updateComment,
  deleteComment,
  addLike,
  removeLike,
  incrementViewCount,
  getUserByEmail,
  getUserByNickname,
  updateUserPassword,
  getCommentCountForPost,
  getCommentsForPost,
  updateUserLastViewedPosts,
  savePost,
  getCommentsByPostId,
  getAllComments,
  saveComment,
  getLikesForPost,
  getLikeCountForPost,
  deleteCommentsByUserEmail,
};
