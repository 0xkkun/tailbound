# 설화(Talebound) - 시작하기

> 신규 개발자를 위한 빠른 시작 가이드

## 목차

1. [프로젝트 소개](#프로젝트-소개)
2. [개발 환경 설정](#개발-환경-설정)
3. [프로젝트 구조 한눈에 보기](#프로젝트-구조-한눈에-보기)
4. [첫 번째 실행](#첫-번째-실행)
5. [주요 파일 위치](#주요-파일-위치)
6. [개발 워크플로우](#개발-워크플로우)
7. [첫 번째 기여 가이드](#첫-번째-기여-가이드)
8. [문제 해결](#문제-해결)

---

## 프로젝트 소개

**설화(Talebound)**는 한국 설화를 배경으로 한 로그라이트 액션 게임입니다.

### 기술 스택

- **게임 엔진**: PixiJS v8 (WebGL 2D)
- **프론트엔드**: React 19 + TypeScript
- **빌드 도구**: Vite
- **테스트**: Vitest
- **패키지 매니저**: pnpm

### 핵심 특징

- 🎮 자동 공격 무기 시스템
- 📊 스탯 시스템 (힘/민첩/지능)
- 🛡️ 사신수 장비 시스템
- 👾 3단계 적 시스템 (일반/정예/보스)
- 🌍 2단계 구조 (상계 → 하계)

---

## 개발 환경 설정

### 필수 요구사항

- **Node.js**: v18 이상
- **pnpm**: v8 이상

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd tailbound

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

브라우저에서 `http://localhost:5173` 열기

### 사용 가능한 명령어

```bash
pnpm dev          # 개발 서버 실행
pnpm build        # 프로덕션 빌드
pnpm preview      # 빌드 결과 미리보기
pnpm test         # 테스트 실행
pnpm lint         # ESLint 검사
pnpm lint:fix     # ESLint 자동 수정
pnpm format       # Prettier 포맷팅
```

---

## 프로젝트 구조 한눈에 보기

```
tailbound/
├── docs/                      # 📚 문서
│   ├── CORE_DESIGN.md        # 게임 디자인 문서
│   ├── architecture.md        # 아키텍처 설계
│   ├── FOLDER_STRUCTURE.md   # 폴더 구조 상세
│   └── implementation/        # 구현 가이드
│       ├── DATA_LAYER.md     # 데이터 레이어 가이드
│       └── GETTING_STARTED.md # 이 문서
│
├── src/
│   ├── config/               # ⚙️ 설정 파일
│   │   ├── game.config.ts    # 게임 시스템 설정
│   │   └── balance.config.ts # 밸런스 수치
│   │
│   ├── game/                 # 🎮 게임 로직
│   │   ├── data/             # 게임 콘텐츠 데이터
│   │   │   ├── weapons.ts    # 무기 데이터베이스
│   │   │   └── enemies.ts    # 적 데이터베이스
│   │   ├── entities/         # 게임 엔티티
│   │   │   ├── Player.ts     # 플레이어
│   │   │   ├── Enemy.ts      # 적
│   │   │   └── Projectile.ts # 투사체
│   │   ├── weapons/          # 무기 구현
│   │   │   ├── Weapon.ts     # 무기 베이스 클래스
│   │   │   └── Talisman.ts   # 부적 무기
│   │   ├── scenes/           # 게임 씬
│   │   │   └── GameScene.ts  # 메인 게임 씬
│   │   └── utils/            # 유틸리티
│   │       └── collision.ts  # 충돌 감지
│   │
│   ├── systems/              # 🔧 게임 시스템
│   │   ├── CombatSystem.ts   # 전투 시스템
│   │   └── SpawnSystem.ts    # 스폰 시스템
│   │
│   ├── components/           # ⚛️ React 컴포넌트
│   │   └── GameContainer.tsx # 게임 컨테이너
│   │
│   ├── hooks/                # 🎣 React 훅
│   │   └── useGameState.ts   # 게임 상태 관리
│   │
│   ├── types/                # 📝 타입 정의
│   │   └── game.types.ts     # 게임 타입
│   │
│   └── App.tsx               # 🏠 앱 진입점
│
├── public/                   # 정적 파일
├── tests/                    # 테스트 파일
└── package.json              # 프로젝트 메타데이터
```

---

## 첫 번째 실행

### 1. 개발 서버 시작

```bash
pnpm dev
```

### 2. 로비 화면

처음 실행하면 로비 화면이 보입니다:
- "게임 시작" 버튼 클릭

### 3. 인게임

- **이동**: WASD 또는 방향키
- **공격**: 자동 (가장 가까운 적 추적)
- **목표**: 최대한 오래 생존하기

### 4. 현재 구현 상태

✅ **구현 완료**:
- 플레이어 이동 및 체력 시스템
- 적 AI (플레이어 추적)
- 부적 무기 (자동 공격)
- 충돌 감지 및 전투
- 적 스폰 시스템
- 난이도 증가 (시간 기반)

⏳ **구현 예정**:
- 레벨업 시스템
- 스탯 시스템
- 장비 시스템
- 추가 무기 (도깨비불, 목탁, 작두날)
- 보스 전투

---

## 주요 파일 위치

### 게임 밸런스를 조정하고 싶다면

👉 [src/config/balance.config.ts](../../src/config/balance.config.ts)

```typescript
export const PLAYER_BALANCE = {
  health: 100,    // 여기서 플레이어 체력 조정
  speed: 250,     // 여기서 이동 속도 조정
  // ...
};
```

### 새 무기를 추가하고 싶다면

1. [src/config/balance.config.ts](../../src/config/balance.config.ts) - 밸런스 추가
2. [src/game/data/weapons.ts](../../src/game/data/weapons.ts) - 데이터 정의
3. [src/game/weapons/](../../src/game/weapons/) - 구현 클래스 생성

👉 자세한 내용: [DATA_LAYER.md](./DATA_LAYER.md#새-무기-추가-체크리스트)

### 게임 로직을 수정하고 싶다면

- **게임 루프**: [src/game/scenes/GameScene.ts](../../src/game/scenes/GameScene.ts)
- **전투 로직**: [src/systems/CombatSystem.ts](../../src/systems/CombatSystem.ts)
- **스폰 로직**: [src/systems/SpawnSystem.ts](../../src/systems/SpawnSystem.ts)

### UI를 수정하고 싶다면

- **메인 앱**: [src/App.tsx](../../src/App.tsx)
- **게임 컨테이너**: [src/components/GameContainer.tsx](../../src/components/GameContainer.tsx)
- **게임 상태**: [src/hooks/useGameState.ts](../../src/hooks/useGameState.ts)

---

## 개발 워크플로우

### 브랜치 전략

```bash
main              # 안정 버전
└── feat/#XX-feature-name  # 기능 개발
```

### 일반적인 개발 흐름

1. **이슈 생성** (선택사항)
2. **브랜치 생성**
   ```bash
   git checkout -b feat/#10-add-new-weapon
   ```

3. **개발**
   ```bash
   pnpm dev  # 개발 서버 실행하며 개발
   ```

4. **테스트**
   ```bash
   pnpm lint      # 코드 스타일 검사
   pnpm test      # 단위 테스트
   pnpm build     # 빌드 확인
   ```

5. **커밋**
   ```bash
   git add .
   git commit -m "feat: Add new weapon system"
   ```

6. **푸시 및 PR**
   ```bash
   git push origin feat/#10-add-new-weapon
   ```

### 코드 스타일

- **ESLint**: 자동 체크 (저장 시)
- **Prettier**: 자동 포맷팅 (저장 시)
- **TypeScript**: 타입 안정성

설정은 대부분 자동으로 적용됩니다.

---

## 첫 번째 기여 가이드

### 추천 시작 태스크

처음 기여하는 분들을 위한 추천 태스크:

#### 1. 밸런스 조정 (난이도: ⭐)

**목표**: 게임 밸런스 수치 조정

```typescript
// src/config/balance.config.ts
export const PLAYER_BALANCE = {
  health: 100,  // 150으로 변경해보기
  speed: 250,   // 300으로 변경해보기
};
```

**학습 내용**: 설정 파일 구조, 데이터 중심 아키텍처

#### 2. 새 적 색상 추가 (난이도: ⭐⭐)

**목표**: 엘리트 적의 색상을 변경

```typescript
// src/game/entities/Enemy.ts
case 'elite':
  this.color = 0xff8855;  // 다른 색상으로 변경
  break;
```

**학습 내용**: 엔티티 구조, PixiJS 렌더링

#### 3. 새 무기 추가 (난이도: ⭐⭐⭐)

**목표**: "도깨비불" 무기 구현

데이터는 이미 정의되어 있으니, 구현 클래스만 작성하면 됩니다:

1. [src/game/weapons/DokkaebiFireWeapon.ts](../../src/game/weapons/) 생성
2. `Talisman.ts`를 참고하여 구현
3. 3방향 발사 로직 추가

**학습 내용**: 무기 시스템, 투사체 생성

**가이드**: [DATA_LAYER.md - 새 무기 추가](./DATA_LAYER.md#새-무기-추가-체크리스트)

#### 4. 레벨 시스템 구현 (난이도: ⭐⭐⭐⭐)

**목표**: 경험치 및 레벨업 시스템 구현

1. `src/systems/LevelSystem.ts` 생성
2. 경험치 계산 로직
3. 레벨업 UI 연동

**학습 내용**: 시스템 아키텍처, 게임 루프 통합

---

## 문제 해결

### 자주 발생하는 문제

#### 1. `pnpm install` 실패

```bash
# Node 버전 확인
node --version  # v18 이상이어야 함

# pnpm 재설치
npm install -g pnpm
```

#### 2. 개발 서버가 시작되지 않음

```bash
# 캐시 삭제
rm -rf node_modules
rm -rf .vite
pnpm install
pnpm dev
```

#### 3. TypeScript 에러

```bash
# 타입 체크
npx tsc --noEmit

# 타입 정의 확인
# src/types/ 디렉토리 참고
```

#### 4. PixiJS 관련 에러

```typescript
// Container 사용 시 주의사항
import { Container, Graphics } from 'pixi.js';

// PixiJS의 x, y를 직접 사용
this.x = 100;  // ✅ 올바름
this.position = { x: 100, y: 100 };  // ❌ 안됨
```

#### 5. 경로 alias 에러

```typescript
// tsconfig.json에 정의된 alias 사용
import { PLAYER_BALANCE } from '@/config/balance.config';  // ✅
import { PLAYER_BALANCE } from '../../config/balance.config';  // ❌ 비추천
```

---

## 유용한 리소스

### 내부 문서

- [CORE_DESIGN.md](../CORE_DESIGN.md) - 게임 디자인 전반
- [architecture.md](../architecture.md) - 아키텍처 설계
- [FOLDER_STRUCTURE.md](../FOLDER_STRUCTURE.md) - 폴더 구조 상세
- [DATA_LAYER.md](./DATA_LAYER.md) - 데이터 레이어 가이드

### 외부 문서

- [PixiJS 공식 문서](https://pixijs.com/guides)
- [React 19 문서](https://react.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Vite 가이드](https://vitejs.dev/guide/)

### 커뮤니티

- GitHub Issues: 버그 리포트 및 기능 제안
- GitHub Discussions: 질문 및 토론

---

## 다음 단계

개발 환경이 설정되었다면:

1. ✅ [DATA_LAYER.md](./DATA_LAYER.md) 읽기 - 데이터 구조 이해하기
2. ✅ 간단한 밸런스 조정해보기
3. ✅ 코드베이스 둘러보기
4. ✅ 첫 번째 PR 만들기

**환영합니다! 🎉**

---

**작성일**: 2025-01-XX
**최종 수정**: 2025-01-XX
**버전**: 1.0
