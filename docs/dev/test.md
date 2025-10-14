# Testing Guide

이 프로젝트는 Vitest를 사용하여 테스트를 작성합니다.

## 설치된 패키지

- **vitest**: 빠른 유닛 테스트 러너
- **@vitest/ui**: Vitest UI 대시보드
- **@testing-library/react**: React 컴포넌트 테스트 유틸리티
- **@testing-library/jest-dom**: DOM matcher 확장
- **@testing-library/user-event**: 사용자 이벤트 시뮬레이션
- **vitest-canvas-mock**: Canvas API 모킹 (PixiJS용)
- **@vitest/coverage-v8**: 코드 커버리지

## 테스트 실행

```bash
# 테스트 실행
pnpm test

# UI 모드로 테스트 실행
pnpm test:ui

# 커버리지 포함 테스트
pnpm test:coverage
```

## PixiJS 테스트 주의사항

PixiJS는 Canvas API와 WebGL을 사용하므로 Node.js 테스트 환경에서는 모킹이 필요합니다.

### 문제점

- **Worker 에러**: PixiJS의 asset loading 시스템이 Worker를 사용
- **Canvas/WebGL**: jsdom은 Canvas 및 WebGL을 완벽하게 지원하지 않음
- **react-reconciler**: @pixi/react의 내부 의존성 문제

### 해결 방법

1. **vitest-canvas-mock 사용**: Canvas API 모킹
2. **PixiJS 모듈 모킹**: 복잡한 PixiJS 로직은 모킹 권장

```typescript
import { vi } from 'vitest';

vi.mock('@pixi/react', () => ({
  Application: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pixi-application">{children}</div>
  ),
  useApplication: () => ({
    app: {
      screen: { width: 800, height: 600 },
    },
  }),
  useTick: vi.fn(),
  extend: vi.fn(),
}));
```

## 테스트 작성 가이드

### 기본 테스트 예제

```typescript
import { describe, expect, it } from 'vitest';

describe('MyComponent', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

### React 컴포넌트 테스트

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### PixiJS 컴포넌트 테스트

PixiJS 컴포넌트는 복잡한 Canvas 렌더링을 포함하므로:

1. **유닛 테스트**: 비즈니스 로직과 상태 관리만 테스트
2. **통합 테스트**: E2E 테스트 도구 사용 권장 (Playwright, Cypress)
3. **모킹 활용**: `src/test/utils.tsx`의 `mockPixiModules()` 사용

```typescript
import { describe, expect, it, vi } from 'vitest';
import { mockPixiModules } from './test/utils';

// PixiJS 모듈 모킹
mockPixiModules();

describe('MyPixiComponent', () => {
  it('should import successfully', async () => {
    const { default: Component } = await import('./MyPixiComponent');
    expect(Component).toBeDefined();
  });
});
```

## 설정 파일

- [vitest.config.ts](../../vitest.config.ts) - Vitest 설정
- [src/test/setup.ts](../../src/test/setup.ts) - 테스트 환경 초기화
- [src/test/utils.tsx](../../src/test/utils.tsx) - 테스트 유틸리티

## 권장 사항

1. **테스트 파일 위치**: 컴포넌트와 같은 디렉토리에 `*.test.tsx` 파일 생성
2. **테스트 범위**:
   - 비즈니스 로직과 상태 관리 중심으로 테스트
   - PixiJS 렌더링 로직은 시각적 테스트나 E2E 테스트로 검증
3. **모킹 전략**: 외부 의존성은 적극적으로 모킹
4. **커버리지**: 핵심 로직은 80% 이상 커버리지 목표

## 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [React Testing Library 문서](https://testing-library.com/react)
- [vitest-canvas-mock](https://github.com/wobsoriano/vitest-canvas-mock)
