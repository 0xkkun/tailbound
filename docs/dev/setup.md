# 개발 환경 설정 가이드

## 기술 스택

### 핵심 기술
- **React 19**: UI 프레임워크
- **PixiJS 8**: 2D WebGL 렌더링 엔진
- **@pixi/react**: PixiJS React 통합
- **TypeScript**: 타입 안정성
- **Vite**: 빌드 도구 및 개발 서버

### 개발 도구
- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅
- **Vitest**: 테스트 프레임워크
- **pnpm**: 패키지 매니저

### 라이브러리
- **react-i18next**: 국제화 (i18n)
- **@testing-library/react**: React 컴포넌트 테스트
- **vitest-canvas-mock**: Canvas API 모킹

## 초기 설정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd tailbound
```

### 2. 패키지 설치

```bash
pnpm install
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

http://localhost:5173에서 확인 가능합니다.

## 프로젝트 구조

```
tailbound/
├── src/
│   ├── components/       # React 컴포넌트
│   ├── i18n/            # 국제화 설정
│   │   ├── config.ts    # i18n 초기화
│   │   ├── types.ts     # TypeScript 타입
│   │   └── locales/     # 번역 파일
│   ├── test/            # 테스트 유틸리티
│   ├── App.tsx          # 메인 앱
│   └── main.tsx         # 진입점
├── docs/                # 프로젝트 문서
│   ├── dev/            # 개발 가이드
│   └── technical/      # 기술 문서
├── public/             # 정적 파일
└── dist/               # 빌드 결과물
```

## Path Aliases

프로젝트는 다음 경로 alias를 사용합니다:

```typescript
// 이전 (상대 경로)
import Component from '../../components/Component';
import i18n from '../i18n/config';

// 이후 (alias 사용)
import Component from '@components/Component';
import i18n from '@i18n/config';
```

### 사용 가능한 Alias

| Alias | 실제 경로 | 예제 |
|-------|---------|------|
| `@/*` | `src/*` | `import App from '@/App'` |
| `@components/*` | `src/components/*` | `import Button from '@components/Button'` |
| `@i18n/*` | `src/i18n/*` | `import i18n from '@i18n/config'` |
| `@test/*` | `src/test/*` | `import { mock } from '@test/utils'` |

### 설정 파일

Path alias는 다음 파일에서 설정되어 있습니다:

1. [vite.config.ts](../../vite.config.ts) - Vite 빌드 설정
2. [vitest.config.ts](../../vitest.config.ts) - Vitest 테스트 설정
3. [tsconfig.app.json](../../tsconfig.app.json) - TypeScript 경로 매핑

## 개발 명령어

### 개발 서버

```bash
pnpm dev          # 개발 서버 시작 (localhost:5173)
pnpm start        # pnpm dev와 동일
```

### 빌드

```bash
pnpm build        # 프로덕션 빌드 (lint + tsc + vite build)
```

### 테스트

```bash
pnpm test              # 테스트 실행
pnpm test:ui           # UI 모드로 테스트
pnpm test:coverage     # 커버리지 포함 테스트
```

자세한 내용은 [test.md](test.md)를 참고하세요.

### 코드 품질

```bash
pnpm lint              # ESLint 검사
pnpm lint:fix          # ESLint 자동 수정
pnpm format            # Prettier 포맷팅
pnpm format:check      # Prettier 검사
```

## ESLint 설정

프로젝트는 다음 ESLint 규칙을 사용합니다:

### 주요 플러그인

- **typescript-eslint**: TypeScript 린팅
- **eslint-plugin-react**: React 규칙
- **eslint-plugin-react-hooks**: React Hooks 규칙
- **eslint-plugin-simple-import-sort**: Import 정렬
- **eslint-plugin-unused-imports**: 미사용 import 제거
- **eslint-plugin-prettier**: Prettier 통합

### 자동 정렬

Import는 다음 순서로 자동 정렬됩니다:

1. Side effect imports (`import './styles.css'`)
2. Node.js builtins (`import path from 'path'`)
3. React 및 외부 패키지 (`import React from 'react'`)
4. 내부 패키지 (alias 사용: `@components`, `@i18n` 등)
5. 부모 디렉토리 (`import '../parent'`)
6. 현재 디렉토리 (`import './sibling'`)
7. 스타일 imports (`import './styles.css'`)

## Prettier 설정

코드 스타일 규칙:

```json
{
  "semi": true,                 // 세미콜론 사용
  "trailingComma": "es5",      // ES5 호환 trailing comma
  "singleQuote": true,         // 싱글 쿼트
  "printWidth": 100,           // 100자 줄 길이
  "tabWidth": 2,               // 2 스페이스 인덴트
  "useTabs": false,            // 탭 대신 스페이스
  "arrowParens": "always",     // 화살표 함수 괄호 항상 사용
  "endOfLine": "lf"            // LF 줄바꿈
}
```

## VS Code 추천 설정

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

## 추천 VS Code 확장

- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅
- **TypeScript Vue Plugin (Volar)**: TypeScript 지원
- **vitest**: 테스트 실행 및 디버깅

## 국제화 (i18n)

프로젝트는 `react-i18next`를 사용합니다.

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t('app.title')}</h1>;
}
```

자세한 내용은 [i18n.md](i18n.md)를 참고하세요.

## 테스트

Vitest와 React Testing Library를 사용합니다.

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MyComponent from '@components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

자세한 내용은 [test.md](test.md)를 참고하세요.

## 문제 해결

### 포트가 이미 사용 중

```bash
# 프로세스 종료
lsof -ti:5173 | xargs kill -9

# 또는 다른 포트 사용
pnpm dev -- --port 3000
```

### 패키지 설치 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript 오류

```bash
# TypeScript 재컴파일
pnpm exec tsc --noEmit
```

### 캐시 문제

```bash
# Vite 캐시 삭제
rm -rf node_modules/.vite
```

## 다음 단계

1. [test.md](test.md) - 테스트 작성 방법
2. [i18n.md](i18n.md) - 국제화 사용법
3. [../technical/architecture.md](../technical/architecture.md) - 코드 아키텍처
4. [../README.md](../README.md) - 프로젝트 문서 허브

## 참고 자료

- [Vite 공식 문서](https://vitejs.dev/)
- [React 공식 문서](https://react.dev/)
- [PixiJS 공식 문서](https://pixijs.com/)
- [TypeScript 공식 문서](https://www.typescriptlang.org/)
- [Vitest 공식 문서](https://vitest.dev/)
