// src/models/userModel.js
const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');

// 사용자 데이터를 읽는 함수
const readUsers = () => {
  const data = fs.readFileSync(usersFilePath);
  return JSON.parse(data);
};

// 사용자 데이터를 추가하는 함수
const addUser = (user) => {
  const users = readUsers();
  users.push(user);
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

module.exports = { readUsers, addUser };
