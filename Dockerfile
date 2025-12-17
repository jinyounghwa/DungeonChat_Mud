# Backend + Frontend Build
FROM node:20-alpine AS builder

WORKDIR /app

# Backend 빌드
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci
COPY backend/src ./src
COPY backend/tsconfig.json .
RUN npm run build

# Frontend 빌드
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/src ./src
COPY frontend/*.json ./
COPY frontend/index.html .
RUN npm run build

# Runtime
FROM node:20-alpine

WORKDIR /app

# Backend 런타임 의존성
COPY backend/package*.json ./
RUN npm ci --omit=dev

# 빌드 결과 복사
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/frontend/dist ./public

# 포트 노출
EXPOSE 4000

# 실행
CMD ["node", "dist/main.js"]
