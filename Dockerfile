FROM node:latest
WORKDIR /usr/src/app

# package.json과 package-lock.json을 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# db.js와 server.js를 복사
COPY ./db.js ./
COPY ./server.js ./

# userUploads와 boardUploads 디렉토리 생성 (존재하지 않을 경우)
RUN mkdir -p /usr/src/app/userUploads /usr/src/app/boardUploads

# userUploads와 boardUploads 폴더에 파일 복사
COPY userUploads/ /usr/src/app/userUploads/
COPY boardUploads/ /usr/src/app/boardUploads/

# src 디렉토리 복사
COPY ./src ./src

EXPOSE 3000

CMD ["node", "server.js"]
