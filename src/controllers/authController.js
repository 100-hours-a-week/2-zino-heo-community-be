// src/controllers/authController.js
const { addUser, readUsers } = require('../models/userModel');

exports.register = (req, res) => {
  const { email, password, passwordConfirm, nickname, profileImage } = req.body;

  // 비밀번호 확인
  if (password !== passwordConfirm) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  // 사용자 데이터 추가
  const users = readUsers();
  const existingUser = users.find((user) => user.email === email);

  if (existingUser) {
    return res.status(400).json({ error: 'Email already exists.' });
  }

  const newUser = { email, password, nickname, profileImage };
  addUser(newUser);

  res.status(201).json({ message: 'User registered successfully.' });

  console.log('회원가입 요청:', req.body); // 요청 데이터 로그 추가
};
