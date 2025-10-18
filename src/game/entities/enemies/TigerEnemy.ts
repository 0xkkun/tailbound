/**
 * 호랑이 적
 */

import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class TigerEnemy extends BaseEnemy {
  // 호랑이 스프라이트 설정 (56x56 스프라이트 시트, 8프레임)
  private static readonly SPRITE_CONFIG: EnemySpriteConfig = {
    assetPath: '/assets/tiger-walk.png',
    totalWidth: 448, // 56 * 8 frames
    height: 56,
    frameCount: 8,
    scale: 1, // 원본 크기 사용
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return TigerEnemy.SPRITE_CONFIG;
  }

  protected getEnemyType(): string {
    return 'tiger';
  }

  /**
   * 호랑이 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    return BaseEnemy.preloadSpriteType('tiger', TigerEnemy.SPRITE_CONFIG);
  }
}
