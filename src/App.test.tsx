import { describe, expect, it, vi } from 'vitest';

// Mock PixiJS modules to avoid complex dependencies
vi.mock('@pixi/react', () => ({
  Application: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pixi-application">{children}</div>
  ),
  useApplication: () => ({
    app: {
      screen: { width: 800, height: 600 },
    },
  }),
  useTick: () => {},
  extend: () => {},
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
}));

describe('App', () => {
  it('should import successfully', async () => {
    // Dynamic import to apply mocks
    const { default: App } = await import('./App');
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  it('example test - basic math', () => {
    expect(1 + 1).toBe(2);
  });
});
