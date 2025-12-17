# 🎮 DungeonChat - AI 텍스트 던전 RPG

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20%2B-green)](https://nodejs.org/)
[![Framework](https://img.shields.io/badge/Frontend-React%2BVite-61dafb)](https://react.dev/)
[![Framework](https://img.shields.io/badge/Backend-NestJS-ea2845)](https://nestjs.com/)

## 📖 프로젝트 소개

**DungeonChat**은 로컬 AI 모델(Ollama)을 활용한 가볍고 재미있는 **텍스트 기반 던전 RPG** 게임입니다.

### ✨ 핵심 기능

- 🎯 **한국어 전용**: 모든 게임 응답이 100% 한국어로 출력됨
- 🧠 **AI 기반 스토리**: Ollama의 QWEN 모델로 동적인 게임 스토리 생성
- 📊 **자동 상태 관리**: AI 응답에서 체력, 경험치, 레벨 자동 감지 및 적용
- 🎖️ **동적 레벨업**: 경험치 100 당 1레벨 자동 상승
- 💾 **간단한 저장**: 파일 기반 게임 상태 관리 (DB 없음)
- 🎲 **RAG 시스템**: 게임 컨텍스트 기억 기능으로 연속성 보장
- ⚡ **경량화**: 최소 의존성으로 빠른 설치 및 실행
- 🔄 **다양한 응답**: 높은 Temperature로 반복되지 않는 AI 응답
- 🧹 **자동 정제**: 중국어, 특수기호, 영문 자동 제거

---

## 🚀 5분 빠른 시작

### 1️⃣ 필수 요구사항 확인

```bash
node --version    # v20 이상 필요
npm --version     # v10 이상 필요
```

### 2️⃣ 프로젝트 클론

```bash
git clone https://github.com/younghwa-jin/DungeonChat_Mud.git
cd DungeonChat_Mud
```

### 3️⃣ 환경 설정

```bash
# 백엔드 설치
cd backend
npm install

# 프론트엔드 설치
cd ../frontend
npm install
cd ../
```

### 4️⃣ Ollama 실행 확인

```bash
# Ollama가 실행 중인지 확인
curl http://localhost:11434/api/tags

# 예상 응답:
# {"models":[{"name":"qwen2.5:7b-instruct-q4_K_M"...}]}
```

### 5️⃣ 개발 서버 시작

```bash
# 터미널 1: 백엔드 (포트 4000)
cd backend
npm run start:dev

# 터미널 2: 프론트엔드 (포트 3000)
cd frontend
npm run dev
```

**접속 주소:**
- 🌐 게임 프론트엔드: http://localhost:3000
- 🔌 백엔드 API: http://localhost:4000/api
- 🤖 Ollama API: http://localhost:11434

---

## 📋 시스템 요구사항

| 항목 | 최소 사양 | 설명 |
|------|---------|------|
| **OS** | Linux/macOS/Windows | 모두 지원 |
| **Node.js** | 20.0+ | npm 패키지 관리자 포함 |
| **RAM** | 4GB | 게임 + AI 모델 실행 가능 |
| **CPU** | 2-core | 일반 PC/Mac 충분 |
| **Storage** | 300MB | 프로젝트 + 의존성 |
| **Ollama** | 필수 | 11434 포트에서 실행 중 |

### Ollama 설정 (✅ 이미 설치됨!)

당신의 시스템에는 다음 모델들이 설치되어 있습니다:

```
✅ qwen2.5:7b-instruct-q4_K_M (4.6GB) ← 게임 스토리 생성용
✅ mxbai-embed-large (669MB) ← RAG 임베딩용
```

---

## 🎮 게임 사용법

### 게임 시작

1. http://localhost:3000 접속
2. 기본 캐릭터로 즉시 게임 시작
3. 한국어로 명령어 입력하여 게임 진행

### 게임 명령어 예시

```
앞으로 나아간다
검은 드래곤을 공격한다
주변을 살펴본다
도망친다
마법으로 불 공격
```

---

## 🤖 핵심 기능 상세

### 1️⃣ 한국어 필터링 시스템

**문제:** AI 모델에서 중국어가 섞여 나옴
**해결:** 자동 재시도 + 중국어 제거 + 한글 추출

```
AI 응답 수신
    ↓
1. 한국어 비율 계산
    ↓
2. 부족하면 재시도 (최대 3회)
    ↓
3. 중국어 자동 제거
    ↓
4. 순수 한국어만 추출
    ↓
5. ">" 접두사 추가
    ↓
완성된 한국어 응답
```

**기술 상세:**
- 정규식 기반 한글 감지 (가-힣, 한글 자모)
- CJK 문자 선택적 제거
- Temperature: 0.8 (높은 다양성)
- 재시도 로직: 최대 3회
- 한국어 임계값: 70%

### 2️⃣ 게임 상태 자동 분석

**AI 응답에서 자동으로 감지:**

#### 체력(Health)
```
"체력이 20 감소" → -20 적용
"+20 체력이 회복" → +20 적용
"회복되었다" → +15 (기본값)
"죽었다" → 체력 0
```

#### 경험치(Experience)
```
"경험치 50점 획득" → +50 적용
"몬스터 처치" → +30 기본값
"골렘을 격파했다" → +30 기본값
"경험치를 얻었다" → +30 기본값
```

#### 층(Floor)
```
"다음 층으로 이동" → floor + 1
"5층으로 진입" → floor = 5
"내려간다" → floor + 1
```

#### 레벨업
```
경험치 100당 1레벨 자동 상승
레벨업 시 응답에 "🎉 [레벨업!]" 표시
```

### 3️⃣ 텍스트 정제 시스템

**제거되는 패턴:**

| 패턴 | 예시 | 동작 |
|------|------|------|
| **언더스코어 감싼** | `_BRANCH_`, `_TAG_` | 제거 |
| **언더스코어 연결** | `WORD_WORD`, `variable_name` | 제거 |
| **연속 특수문자** | `@@@`, `###`, `$$$` | 제거 |
| **특수문자 감싼** | `<TAG>`, `{OBJ}`, `[ARR]` | 제거 |

---

## 🏗️ 프로젝트 구조

```
DungeonChat_Mud/
├── backend/                           # NestJS 백엔드
│   ├── src/
│   │   ├── game/
│   │   │   ├── services/
│   │   │   │   ├── game-chat.service.ts           # 게임 로직 + 상태 적용
│   │   │   │   ├── ai.service.ts                  # AI + 한국어 필터링
│   │   │   │   ├── game-state-analyzer.service.ts # 상태 분석 (핵심)
│   │   │   │   ├── rag.service.ts                 # 컨텍스트 관리
│   │   │   │   └── storage.service.ts             # 파일 저장소
│   │   │   └── controllers/
│   │   │       └── game-chat.controller.ts        # API 엔드포인트
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                          # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatMessage.tsx        # 메시지 UI
│   │   │   └── GameStats.tsx          # 게임 상태 표시
│   │   ├── pages/
│   │   │   └── ChatScreen.tsx         # 게임 화면
│   │   ├── store/
│   │   │   └── gameStore.ts           # Zustand 상태 관리
│   │   ├── api/
│   │   │   └── client.ts              # API 클라이언트
│   │   ├── types/
│   │   │   └── game.ts                # TypeScript 타입
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
├── README.md
└── package-lock.json
```

---

## 🔧 기술 스택

### Frontend
- **React** 19.2.3 - UI 프레임워크
- **Vite** 7.2.4 - 번들러
- **TypeScript** 5.9+ - 타입 안전성
- **Zustand** 5.0.9 - 상태 관리
- **Tailwind CSS** - 스타일링
- **Axios** - HTTP 클라이언트

### Backend
- **NestJS** 10.4.1 - 프레임워크
- **TypeScript** 5.9+ - 언어
- **Axios** - HTTP 클라이언트
- **RxJS** - 리액티브 프로그래밍

### AI & 저장소
- **Ollama** - 로컬 AI 모델 (11434 포트)
- **QWEN 2.5 7B** - 게임 스토리 생성
- **mxbai-embed-large** - RAG 임베딩
- **파일 시스템** - JSON 기반 게임 상태 저장

---

## 📡 API 문서

### 게임 메시지 처리

```http
POST /api/game/chat
Content-Type: application/json

{
  "characterId": "hero-1",
  "message": "앞으로 나아간다"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "response": "> 어둠이 깔린 복도를 따라 걷다가 멀리서 으르렁거리는 소리가 들린다.",
    "characterId": "hero-1",
    "gameState": {
      "characterId": "hero-1",
      "floor": 1,
      "health": 85,
      "maxHealth": 100,
      "experience": 30,
      "level": 1,
      "lastUpdated": "2025-12-17T03:00:00.000Z"
    },
    "stateUpdate": {
      "health": 85,
      "healthChanged": true
    }
  }
}
```

### 게임 상태 조회

```http
GET /api/game/state/:characterId
```

### 게임 리셋

```http
POST /api/game/clear/:characterId
```

---

## 💾 데이터 저장 방식

### 게임 상태 저장

게임 상태는 `data/{characterId}.json` 파일로 저장됩니다:

```json
{
  "characterId": "hero-1",
  "floor": 1,
  "health": 85,
  "maxHealth": 100,
  "experience": 30,
  "level": 1,
  "lastUpdated": "2025-12-17T03:00:00.000Z"
}
```

### 게임 컨텍스트 (RAG)

게임의 이전 상황들이 메모리에 저장되어 다음 응답 생성 시 참고됩니다:
- 최대 10개의 컨텍스트 유지
- 시간 기반 자동 정리
- 캐릭터별 독립적 관리

---

## 🚀 배포 방법

### 프로덕션 빌드

```bash
# 백엔드 빌드
cd backend
npm run build
npm run start

# 프론트엔드 빌드
cd frontend
npm run build
npm run preview
```

### Docker로 배포 (선택사항)

```bash
docker-compose up -d
```

---

## 🐛 문제 해결

### 포트 충돌

```bash
# 포트 4000 확인
lsof -i :4000

# 백그라운드 프로세스 종료
pkill -f "node dist/main.js"
```

### Ollama 연결 오류

```bash
# Ollama 실행 확인
curl http://localhost:11434/api/tags

# Ollama 실행 (설치되지 않은 경우)
ollama serve
```

### 의존성 문제

```bash
# 캐시 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 프로젝트 통계

```
📦 번들 크기:
  - 백엔드: ~50KB (컴파일 후)
  - 프론트엔드: ~200KB (번들)

📈 코드 규모:
  - 백엔드: ~800 라인
  - 프론트엔드: ~800 라인

⚡ 성능:
  - 게임 응답: 2-5초 (AI 생성 시간)
  - API 응답: <100ms
  - 한국어 필터링: <500ms (재시도 포함)
  - 상태 분석: <50ms
```

---

## 🔐 보안 고려사항

- 환경 변수로 API 설정 관리
- Ollama는 로컬 네트워크에서만 실행
- API는 기본적인 요청 검증 포함
- 프로덕션 배포 시 CORS 설정 필요

---

## 📝 환경 변수

### 백엔드 (`backend/.env`)

```env
PORT=4000
NODE_ENV=development
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b-instruct-q4_K_M
OLLAMA_EMBEDDING_MODEL=mxbai-embed-large
```

### 프론트엔드 (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000
```

---

## 🤝 기여 방법

1. 저장소 Fork
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'feat: add amazing feature'`)
4. 브랜치 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

---

## 📄 라이선스

MIT License © 2025 Jin Young Hwa

---

## 📞 연락처

- 📧 **이메일**: timotolkie@gmail.com
- 🐛 **버그 리포트**: [GitHub Issues](https://github.com/younghwa-jin/DungeonChat_Mud/issues)

---

## ✨ 주요 업데이트 기록

### v1.2.0 (2025-12-17)
- ✅ 텍스트 정제 시스템 추가 (특수기호, 영문 제거)
- ✅ AI 응답 다양성 개선 (Temperature 0.8)
- ✅ 자동 상태 분석 로직 개선

### v1.1.0 (2025-12-17)
- ✅ 게임 상태 자동 분석 시스템 구현
- ✅ 체력, 경험치, 층, 레벨 자동 감지
- ✅ 자동 레벨업 시스템
- ✅ 상세한 로깅 추가

### v1.0.0 (2025-12-17)
- ✅ 한국어 필터링 시스템 구현
- ✅ AI 자동 재시도 로직 (최대 3회)
- ✅ 중국어 제거 및 한글 추출
- ✅ Prisma 제거로 경량화
- ✅ 파일 기반 저장소 구현
- ✅ RAG 컨텍스트 관리 시스템

---

**Last Updated**: 2025-12-17 | **Status**: ✅ Production Ready
