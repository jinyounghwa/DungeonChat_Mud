# DungeonChat MUD 게임 - 프로젝트 현황

## 프로젝트 개요
CLI 스타일의 레트로 감성을 가진 모바일 웹 기반 텍스트 던전 RPG (MUD) 게임

**개발 기간**: 2주 (1주 완료, 1주 남음)
**최종 목표**: 완전히 기능하는 텍스트 MUD 게임

---

## Week 1 완료 현황 (100%)

### ✅ Day 1: 프로젝트 셋업
- [x] Next.js + Vite 프론트엔드 생성
- [x] NestJS 백엔드 생성
- [x] PostgreSQL Docker Compose 설정
- [x] Prisma 스키마 작성 (6개 모델)
- [x] 필수 npm 패키지 설치

**생성된 모델**: User, Character, Inventory, BattleLog, Conversation, SaveState

### ✅ Day 2: JWT 인증 시스템
- [x] Auth Service (회원가입, 로그인, 토큰 갱신, 비밀번호 변경)
- [x] JWT 전략 & Guard
- [x] Auth Controller (5개 엔드포인트)
- [x] ConfigModule 설정
- [x] CORS 설정

**API 엔드포인트**:
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/logout` - 로그아웃
- `POST /auth/refresh` - 토큰 갱신
- `PATCH /auth/password` - 비밀번호 변경

### ✅ Day 3: AI 통합
- [x] AI Service (vLLM API 통신)
- [x] 프롬프트 템플릿
  - 던전 설명 생성
  - 몬스터 등장 묘사
  - 전투 장면 묘사
  - 레벨업 메시지
- [x] AI Module 추가

### ✅ Day 4: 캐릭터 시스템
- [x] 캐릭터 생성 (3가지 직업)
  - 용사 (Warrior): 균형잡힌 스탯
  - 마법사 (Mage): 높은 공격력
  - 도둑 (Thief): 높은 회피율
- [x] 직업별 초기 스탯 & 레벨업 증가량
- [x] 경험치 시스템 (Lv.N = N*100 EXP)
- [x] 캐릭터 조회 & 통계 조회

**API 엔드포인트**:
- `POST /characters` - 캐릭터 생성
- `GET /characters/:id` - 캐릭터 조회
- `GET /characters/:id/stats` - 스탯 조회

### ✅ Day 5: 전투 시스템
- [x] 몬스터 생성 시스템
  - 층별 몬스터 풀
  - 난이도 기반 스탯 계산
  - 플레이어 레벨 대비 ±2 조정
- [x] 전투 액션
  - 공격 (크리티컬, 데미지 계산)
  - 방어 (50% 데미지 감소)
  - 도망 (직업별 성공률)
- [x] 데미지 계산 공식
  - 기본: ATK - (DEF/2), 최소 1
  - 크리티컬: 1.5배 데미지
  - 회피: 10% 회피율 + 직업별 차등
- [x] 보상 시스템
  - 경험치: Lv * 10
  - 골드: Lv * 5
  - 아이템 드롭: 30% 확률

**API 엔드포인트**:
- `POST /battles/start` - 전투 시작
- `POST /battles/:id/attack` - 공격
- `POST /battles/:id/defend` - 방어
- `POST /battles/:id/escape` - 도망
- `POST /battles/:id/finish` - 전투 종료

### ✅ Day 6: 채팅 화면 UI
- [x] Game Types 정의
- [x] Zustand 상태 관리
- [x] Axios API 클라이언트
- [x] ChatMessage 컴포넌트
- [x] ChatScreen 페이지 (메인 게임)
- [x] CLI 스타일 CSS
  - 다크 테마 (#0a0e14)
  - 그린 터미널 색상 (#00ff00)
  - 메시지 타입별 색상 구분

### ✅ Day 7: 마이페이지 UI
- [x] 캐릭터 정보 카드
- [x] 탭 시스템 (스탯 / 인벤토리 / 전투기록)
- [x] 스탯 표시 (HP 바, ATK, DEF, 골드)
- [x] 인벤토리 섹션
- [x] 전투 기록 표시
- [x] 액션 버튼

---

## Week 2 계획 (0% - 미작업)

### Day 8: 레벨 시스템 최적화
- [ ] 경험치 획득 로직 완성
- [ ] 레벨업 계산 및 자동 증가
- [ ] 스탯 자동 증가
- [ ] 레벨업 알림 UI

### Day 9: 아이템 시스템
- [ ] 아이템 드롭 로직
- [ ] 인벤토리 관리 API
- [ ] 아이템 사용 기능
- [ ] 장비 착용 시스템

### Day 10: 저장/불러오기
- [ ] 저장 API 구현
- [ ] 불러오기 API 구현
- [ ] 저장 슬롯 관리
- [ ] 자동 저장 기능
- [ ] 저장/불러오기 UI

### Day 11: 몬스터 & 던전
- [ ] 몬스터 데이터 추가 (20종)
- [ ] 층별 몬스터 배치
- [ ] 보스 몬스터 구현
- [ ] 던전 진행도 시스템

### Day 12: RAG 시스템
- [ ] Chroma Vector DB 설정
- [ ] 컨텍스트 임베딩
- [ ] 검색 로직 구현
- [ ] AI 프롬프트에 컨텍스트 추가

### Day 13: 테스트 & 버그 수정
- [ ] 전투 로직 테스트
- [ ] AI 응답 품질 테스트
- [ ] 저장/불러오기 테스트
- [ ] 모바일 반응형 테스트
- [ ] 버그 수정

### Day 14: 최종 점검 & 배포
- [ ] 성능 최적화
- [ ] Docker Compose 최종화
- [ ] 배포 스크립트
- [ ] 문서 최종 업데이트
- [ ] 프로덕션 배포

---

## 기술 스택

### Frontend
- **Framework**: React + Vite
- **Language**: TypeScript
- **State**: Zustand
- **HTTP**: Axios
- **Styling**: CSS (Dark Theme)

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT + Bcrypt
- **AI**: Qwen 2.5 7B (vLLM)
- **Vector DB**: Chroma (계획)

### Infrastructure
- **Containerization**: Docker Compose
- **Development**: Local hosting
- **Deployment**: Docker (계획)

---

## API 명세 요약

### 인증 (5개)
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/logout` - 로그아웃
- `POST /auth/refresh` - 토큰 갱신
- `PATCH /auth/password` - 비밀번호 변경

### 캐릭터 (3개)
- `POST /characters` - 생성
- `GET /characters/:id` - 조회
- `GET /characters/:id/stats` - 통계

### 전투 (5개)
- `POST /battles/start` - 시작
- `POST /battles/:id/attack` - 공격
- `POST /battles/:id/defend` - 방어
- `POST /battles/:id/escape` - 도망
- `POST /battles/:id/finish` - 종료

**추가 계획**: 인벤토리, 저장/불러오기, 대화 기록 등

---

## 주요 게임 메커니즘

### 직업 시스템 (3가지)
| 직업 | HP | ATK | DEF | 특성 | 크리확 | 회피율 | 도망율 |
|------|-----|-----|-----|------|--------|--------|--------|
| 용사 | 120 | 15 | 12 | 균형 | 10% | 5% | 50% |
| 마법사 | 80 | 20 | 8 | 공격 | 10% | 5% | 50% |
| 도둑 | 100 | 18 | 10 | 회피 | 20% | 15% | 70% |

### 데미지 계산
```
기본 데미지 = ATK - (DEF / 2), 최소 1
크리티컬 데미지 = 기본 데미지 × 1.5
방어 시 50% 감소
```

### 경험치 시스템
```
Lv.N → Lv.(N+1): N × 100 EXP 필요
몬스터 처치: Lv × 10 EXP 획득
```

---

## 현재 이슈 & 주의사항

### 미완료 항목
1. **컴파일 오류**: NestJS 백엔드에 TS 오류 존재 (Day 5 후반 발생)
   - 해결 필요: AiService 메서드 확인, GenerationConfig 타입 정리

2. **데이터베이스 마이그레이션**: Prisma migration 미실행
   - 필요: `npm run prisma:migrate`

3. **AI 서버**: vLLM 서버 미설정
   - 필요: `docker-compose up qwen`

### 보안 주의
- JWT_SECRET 변경 필요 (프로덕션)
- BCRYPT_SALT_ROUNDS 권장값: 10-12
- CORS origin 제한 필요
- 입력 검증 추가 필요

---

## 다음 단계

1. **Day 8 시작 전**:
   - [ ] TypeScript 오류 수정
   - [ ] Prisma 마이그레이션 실행
   - [ ] 로컬 서버 테스트 (NestJS + 프론트엔드)
   - [ ] API 엔드포인트 테스트

2. **Week 2 개발**:
   - 레벨 & 아이템 시스템 완성
   - 저장/불러오기 기능
   - RAG 시스템 구현
   - 전체 통합 테스트
   - 배포 준비

---

**최종 수정**: 2024-12-16
**작업 상태**: Week 1 완료, Week 2 준비 중
