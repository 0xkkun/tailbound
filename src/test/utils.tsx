import { vi } from 'vitest';

/**
 * Mock PixiJS modules for testing
 * PixiJS는 Canvas API와 WebGL을 사용하므로 테스트 환경에서 모킹이 필요합니다.
 */
export const mockPixiModules = () => {
  vi.mock('@pixi/react', () => ({
    Application: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pixi-application">{children}</div>
    ),
    useApplication: () => ({
      app: {
        screen: { width: 800, height: 600 },
        stage: {},
        renderer: {},
      },
    }),
    useTick: vi.fn(),
    extend: vi.fn(),
  }));

  vi.mock('pixi.js', () => ({
    Assets: {
      load: vi.fn().mockResolvedValue({}),
    },
    Container: vi.fn(),
    Sprite: vi.fn(),
    Texture: {
      EMPTY: {},
    },
    Graphics: vi.fn(),
    Text: vi.fn(),
  }));
};
