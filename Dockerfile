FROM node:latest
WORKDIR /usr/src/app

# package.json과 package-lock.json을 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# db.js와 server.js를 복사
COPY ./db.js ./
COPY ./server.js ./
COPY ./src ./src
COPY ./boardUploads ./boardUploads
COPY ./userUploads ./userUploads

EXPOSE 3000

CMD ["node", "server.js"]
