# DungeonChat RAG 벡터화 시스템 구현 가이드

## 개요

게임 문서를 벡터화하여 AI가 게임을 진행할 때 관련 정보를 자동으로 검색하고 활용할 수 있도록 구현한 RAG(Retrieval-Augmented Generation) 시스템입니다.

## 구조

### 1. 게임 문서 (GAME_DOCUMENTATION.md)

**위치**: `/GAME_DOCUMENTATION.md`

**내용**:
- 던전의 세계 - 층별 특징, 환경, 분위기
- 몬스터 가이드 - 각 층별 몬스터의 특징, 대사, 전투 패턴
- 전투 시스템 - 공격, 방어, 회피 패턴
- 대화 스타일 - AI의 톤, 상황별 대사 예시
- 게임 상태 표현 - 체력, 경험치, 레벨 변화 표시 방법
- 상황별 대사 예시 - 전투, 탐색, 몬스터 만남 등 구체적인 예시

**특징**:
- AI가 직접 참고할 수 있는 순수 게임 콘텐츠
- 기술적 설명 제외
- 게임 월드의 생생한 표현에 중점

### 2. 게임 문서 RAG 서비스

**위치**: `/backend/src/game/services/game-documentation-rag.service.ts`

**핵심 기능**:

#### 초기화 (initialize)
```typescript
async initialize(): Promise<void>
```
- 게임 문서를 로드하고 섹션별로 파싱
- 각 섹션의 벡터를 생성하여 메모리에 캐싱

#### 문서 파싱 (parseDocumentation)
```typescript
private parseDocumentation(content: string): DocumentSection[]
```
- 마크다운 문서를 `##` 헤더 기준으로 섹션 분할
- 각 섹션에 고유 ID 부여

#### 벡터화 (getEmbedding)
```typescript
private async getEmbedding(text: string): Promise<number[]>
```
- Ollama의 `mxbai-embed-large` 모델 사용
- 텍스트를 1024차원 벡터로 변환
- 캐싱으로 동일 텍스트의 중복 처리 방지

#### 유사도 검색 (cosineSimilarity)
```typescript
private cosineSimilarity(vecA: number[], vecB: number[]): number
```
- 두 벡터의 코사인 유사도 계산
- 0~1 범위의 유사도 점수 반환

#### 검색 (search)
```typescript
async search(query: string, topK: number = 3): Promise<SearchResult[]>
```
- 쿼리를 벡터화
- 모든 섹션과의 유사도 계산
- 상위 K개 섹션 반환
- 0.3 이상의 유사도만 포함

### 3. 고급 검색 메서드

**몬스터 컨텍스트**
```typescript
async getMonsterContext(monsterType: string): Promise<string>
```
예: `getMonsterContext('드래곤')` → 드래곤 관련 정보 반환

**층 컨텍스트**
```typescript
async getFloorContext(floor: number): Promise<string>
```
예: `getFloorContext(2)` → 2층 환경 정보 반환

**전투 컨텍스트**
```typescript
async getCombatContext(): Promise<string>
```
→ 전투 시스템 관련 정보 반환

**플레이어 행동 컨텍스트**
```typescript
async getContextForPlayerAction(action: string): Promise<string>
```
예: `getContextForPlayerAction('검으로 오크를 공격한다')` → 관련 정보 반환

### 4. 게임 채팅 서비스 통합

**위치**: `/backend/src/game/services/game-chat.service.ts`

**통합 방식**:

```typescript
// 1. 서비스 주입
constructor(
  ...
  private gameDocRagService: GameDocumentationRagService,
)

// 2. 초기화 (OnModuleInit)
async onModuleInit(): Promise<void> {
  await this.gameDocRagService.initialize();
}

// 3. 프롬프트에 컨텍스트 추가
async processMessage(characterId, message) {
  // 플레이어 행동 기반 검색
  gameDocContext = await this.gameDocRagService.getContextForPlayerAction(message);
  
  // 층 기반 검색
  const floorContext = await this.gameDocRagService.getFloorContext(state.floor);
  
  // 프롬프트에 포함
  const prompt = `[게임 가이드]\n${gameDocContext}\n...`;
}
```

## 작동 원리

### 1. 초기화 단계
```
게임 시작
    ↓
GameChatService 초기화
    ↓
GameDocumentationRagService.initialize()
    ↓
GAME_DOCUMENTATION.md 로드
    ↓
섹션별 파싱 (## 기준)
    ↓
각 섹션 벡터화
    ↓
메모리 캐싱
    ↓
준비 완료
```

### 2. 게임 플레이 단계
```
플레이어 명령어 입력
    ↓
GameChatService.processMessage()
    ↓
플레이어 행동 기반 검색
    gameDocRagService.getContextForPlayerAction(message)
    ↓
층 기반 검색
    gameDocRagService.getFloorContext(floor)
    ↓
검색 결과를 프롬프트에 추가
    ↓
AI가 게임 문서를 참고하여 응답 생성
    ↓
일관된 게임 스토리 제공
```

### 3. 검색 알고리즘
```
사용자 쿼리: "드래곤을 공격한다"
    ↓
벡터화: [0.23, 0.45, -0.12, ..., 0.89] (1024차원)
    ↓
모든 섹션과 유사도 계산:
  - "드래곤" 섹션: 0.87 ✓
  - "4층 몬스터" 섹션: 0.82 ✓
  - "전투 시스템" 섹션: 0.76 ✓
  - "대화 스타일" 섹션: 0.25 ✗ (0.3 미만)
    ↓
상위 3개 반환:
  [0] 드래곤 정보
  [1] 4층 환경
  [2] 전투 시스템
    ↓
프롬프트에 추가
```

## 성능 최적화

### 벡터 캐싱
- `Map<string, number[]>` 사용
- 동일 텍스트 재계산 방지
- 메모리 사용 대신 속도 향상

### 섹션 벡터 캐싱
- 문서 초기화 시 모든 섹션 벡터화
- 게임 플레이 중에는 캐시된 벡터 사용
- 쿼리 벡터만 실시간 생성

### 선택적 검색
- topK 파라미터로 검색 결과 수 제한
- 유사도 임계값(0.3) 설정으로 불필요한 섹션 제외

## 메모리 사용량

### 벡터 크기
- mxbai-embed-large: 1024차원
- 1개 벡터 = 약 4KB (float32 기준)
- 20개 섹션 = 약 80KB

### 캐시
- 섹션 벡터: 80KB
- 쿼리 캐시: 동적 (최대 100개 쿼리 = 400KB)
- **총 메모리: ~1MB (매우 경량)**

## 설정

### 환경 변수 (.env)

```env
# Ollama 설정
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b-instruct-q4_K_M
OLLAMA_EMBEDDING_MODEL=mxbai-embed-large

# RAG 설정
MAX_CONTEXT_MEMORY=10  # 이전 컨텍스트 메모리 크기
CONTEXT_TIMEOUT=3600   # 컨텍스트 타임아웃 (초)
```

## 사용 예시

### 기본 검색
```typescript
const results = await gameDocRagService.search('몬스터 전투');
// [
//   { section: { title: '전투 시스템', content: '...' }, similarity: 0.92 },
//   { section: { title: '몬스터 가이드', content: '...' }, similarity: 0.88 },
//   ...
// ]
```

### 상황별 컨텍스트
```typescript
// 몬스터 조우
const monsterContext = await gameDocRagService.getMonsterContext('오크');
// "오크 정보: 크기 1.5배, 강함, 포악함, ..."

// 층 진입
const floorContext = await gameDocRagService.getFloorContext(3);
// "3층 - 심화: 마법 흔적, 신비한 기운, ..."

// 플레이어 행동
const actionContext = await gameDocRagService.getContextForPlayerAction('회피한다');
// "회피 명령, 방어 기술, ..."
```

## 문제 해결

### "Game documentation not found" 에러
- GAME_DOCUMENTATION.md가 프로젝트 루트에 있는지 확인
- 파일명 철자 확인 (대소문자 구분)

### 빈 검색 결과
- Ollama 서버 실행 확인
- 임베딩 모델 설치 확인: `ollama pull mxbai-embed-large`
- 유사도 임계값 확인 (0.3)

### 느린 초기화
- 첫 초기화는 모든 섹션 벡터화로 시간 소요 (1-2초)
- 이후 캐시된 벡터 사용으로 빠름
- 게임 시작 전에 `initialize()`가 실행되므로 게임 플레이에는 영향 없음

## 향후 개선사항

1. **벡터 영속화**
   - 벡터를 파일에 저장
   - 재시작 시 다시 계산하지 않음

2. **동적 섹션 추가**
   - 게임 중에 새 콘텐츠 추가 가능
   - 섹션별 가중치 조정

3. **고급 필터링**
   - 플레이어 레벨별 관련 정보 필터링
   - 게임 상태 기반 컨텍스트 선택

4. **분석 대시보드**
   - 검색 빈도 분석
   - 활용도 낮은 섹션 개선

---

## 마크다운 문서의 역할

GAME_DOCUMENTATION.md는 더 이상 플레이어를 위한 튜토리얼 문서가 아니라, **AI가 게임을 정확하게 진행하기 위한 참고 자료**입니다.

- **AI 참고용**: 게임 월드의 룰, 몬스터 특징, 대사 방식
- **벡터 검색 대상**: RAG 시스템이 관련 섹션을 자동으로 찾아 프롬프트에 추가
- **일관성 보장**: AI가 항상 같은 게임 규칙과 분위기 유지

---

*DungeonChat RAG 시스템으로 AI가 더욱 정확하고 일관된 게임 경험을 제공합니다!*
