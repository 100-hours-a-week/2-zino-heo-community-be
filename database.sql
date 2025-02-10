USE community;

#DROP TABLE IF EXISTS likes;    -- 좋아요 테이블 드롭
#DROP TABLE IF EXISTS comments; -- 댓글 테이블 드롭
#DROP TABLE IF EXISTS posts;    -- 게시글 테이블 드롭
#DROP TABLE IF EXISTS users;    -- 사용자 테이블 드롭

-- 사용자 생성
#CREATE USER 'admin'@'localhost' IDENTIFIED BY 'cometrue';
#GRANT ALL PRIVILEGES ON community.* TO 'admin'@'localhost';
#FLUSH PRIVILEGES;

-- 사용자 테이블 생성
CREATE TABLE users (
                       email VARCHAR(255) PRIMARY KEY,
                       password VARCHAR(255) NOT NULL,
                       nickname VARCHAR(50) NOT NULL,
                       profileImage VARCHAR(255),
                       createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게시글 테이블 생성
CREATE TABLE posts (
                       id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- AUTO_INCREMENT 추가
                       title VARCHAR(255) NOT NULL,
                       content TEXT NOT NULL,
                       image VARCHAR(255),
                       createdAt DATETIME NOT NULL,
                       author_email VARCHAR(255),
                       author_nickname VARCHAR(50),
                       author_profileImage VARCHAR(255),
                       views INT DEFAULT 0,
                       FOREIGN KEY (author_email) REFERENCES users(email) ON DELETE CASCADE
);

-- 댓글 테이블 생성
CREATE TABLE comments (
                          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- AUTO_INCREMENT 추가
                          content TEXT NOT NULL,
                          createdAt DATETIME NOT NULL,
                          author_email VARCHAR(255),
                          author_nickname VARCHAR(255),
                          author_profile_image VARCHAR(255),
                          post_id BIGINT UNSIGNED,  -- 데이터 타입 일치
                          FOREIGN KEY (author_email) REFERENCES users(email) ON DELETE CASCADE,
                          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 좋아요 테이블 생성
CREATE TABLE likes (
                       user_email VARCHAR(255),
                       post_id BIGINT UNSIGNED,  -- 데이터 타입 일치
                       PRIMARY KEY (user_email, post_id),
                       FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
                       FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
