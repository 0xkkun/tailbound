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

#### 웹 브라우저에서 개발

```bash
pnpm dev
```

http://localhost:5173에서 확인 가능합니다.

#### 인앱 토스 환경에서 개발

- [원본 문서](https://developers-apps-in-toss.toss.im/development/test/sandbox.html)

인앱 토스 환경 전용 기능(햅틱 피드백, Safe Area Insets 등)을 테스트하려면:

1. **디바이스 준비**
   - 모바일 디바이스(iOS/Android) USB 디버깅 활성화
   - 토스 샌드박스 앱 설치

2. **로컬 개발 서버 연결**

   ```bash
   # 디바이스를 USB로 연결 후
   adb reverse tcp:8081 tcp:8081  # Metro dev server
   adb reverse tcp:5173 tcp:5173  # Vite dev server
   ```

   > 💡 Granite가 로컬 개발 서버를 디바이스로 포워딩해줍니다.

3. **토스 샌드박스 앱에서 실행**
   - 토스 샌드박스 앱 실행
   - URL 스킴에 `intoss://tailbound` 입력
   - 앱이 로드되면 인앱 토스 환경 기능 테스트 가능

> 📝 인앱 토스가 아닌 환경에서도 앱은 정상 동작합니다. 인앱 토스 전용 기능은 자동으로 스킵됩니다. ([tossAppBridge.ts](src/utils/tossAppBridge.ts) 참고)

### 빌드

```bash
pnpm build
```

### 배포 (Vercel)

조직 저장소에서 GitHub App 권한 없이 개인 스코프로 배포:

```bash
# 방법 1: 로컬 빌드 후 배포 (빠름)
vercel build --prod
vercel deploy --prebuilt --prod

# 방법 2: Vercel 서버에서 빌드 (간단)
vercel deploy --prod
```

**최초 배포 시 설정:**

- Scope: `ferv0r2's projects` (개인 계정)
- Link to existing project: No
- GitHub 연결 여부: No (권한 이슈 회피)

**주의:** Git 연동 없이 배포하므로 자동 배포는 안 되며, 매번 수동으로 `vercel deploy` 실행 필요.

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
import App from '@/App'; // src/App
import I18nExample from '@components/I18nExample'; // src/components/I18nExample
import i18n from '@i18n/config'; // src/i18n/config
import { mockPixiModules } from '@test/utils'; // src/test/utils
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
