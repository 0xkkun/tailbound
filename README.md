# Tailbound (설화)

React + PixiJS 기반 웹 게임 프로젝트

## 기술 스택

- **React 19**: UI 프레임워크
- **PixiJS 8**: 2D WebGL 렌더링 엔진
- **@pixi/react**: PixiJS React 통합
- **TypeScript**: 타입 안정성
- **Vite**: 빌드 도구
- **react-i18next**: 국제화 (i18n)
- **Vitest**: 테스트 프레임워크

## 시작하기

### 설치

```bash
pnpm install
```

### 개발 서버 실행

```bash
pnpm dev
```

http://localhost:5173에서 확인 가능합니다.

### 빌드

```bash
pnpm build
```

### 테스트

```bash
pnpm test          # 테스트 실행
pnpm test:ui       # UI 모드
pnpm test:coverage # 커버리지 포함
```

### 린트 및 포맷

```bash
pnpm lint          # ESLint 검사
pnpm lint:fix      # ESLint 자동 수정
pnpm format        # Prettier 포맷팅
pnpm format:check  # Prettier 검사
```

## 프로젝트 구조

```
src/
├── components/       # React 컴포넌트
├── i18n/            # 국제화 설정 및 번역 파일
│   ├── config.ts    # i18n 초기화
│   ├── types.ts     # TypeScript 타입 선언
│   └── locales/     # 번역 파일 (ko.json)
├── test/            # 테스트 유틸리티
├── App.tsx          # 메인 앱 컴포넌트
└── main.tsx         # 진입점
```

### Path Aliases

프로젝트에서 다음 경로 alias를 사용합니다:

```typescript
import App from '@/App';                    // src/App
import I18nExample from '@components/I18nExample';  // src/components/I18nExample
import i18n from '@i18n/config';            // src/i18n/config
import { mockPixiModules } from '@test/utils';     // src/test/utils
```

설정 파일:
- [vite.config.ts](vite.config.ts) - Vite alias 설정
- [vitest.config.ts](vitest.config.ts) - Vitest alias 설정
- [tsconfig.app.json](tsconfig.app.json) - TypeScript paths 설정

## 문서

### 개발 가이드
- [개발 환경 설정](docs/dev/setup.md) - 초기 설정 및 Path Aliases
- [테스트 가이드](docs/dev/test.md) - Vitest 및 PixiJS 테스트 방법
- [국제화 가이드](docs/dev/i18n.md) - i18n 사용법 및 번역 추가 방법

### 프로젝트 문서
- [문서 허브](docs/README.md) - 모든 프로젝트 문서 목록
- [아키텍처](docs/technical/architecture.md) - 코드 아키텍처 및 설계

## 개발 환경

### ESLint 설정

- TypeScript ESLint
- React 관련 플러그인
- Import 정렬 및 최적화
- Prettier 통합

### Prettier 설정

- 세미콜론 사용
- 싱글 쿼트
- 2 스페이스 인덴트
- 100자 줄 길이

## 주요 기능

- ✅ PixiJS 8 통합
- ✅ TypeScript 지원
- ✅ 국제화 (i18n) - 한국어 지원
- ✅ 테스트 환경 (Vitest + Canvas Mock)
- ✅ ESLint + Prettier
- 🚧 게임 메커니즘 (개발 중)

## 라이선스

MIT