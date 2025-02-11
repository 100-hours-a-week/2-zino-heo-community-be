FROM node:latest
WORKDIR /usr/src/app

# package.json과 package-lock.json을 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

COPY ./db.js ./
COPY ./server.js ./
COPY ./userUploads ./userUploads
COPY ./boardUploads ./boardUploads
COPY ./src ./src

EXPOSE 3000

CMD ["node", "server.js"]
