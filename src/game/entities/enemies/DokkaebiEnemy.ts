/**
 * 도깨비 적
 */

import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class DokkaebiEnemy extends BaseEnemy {
  // 도깨비 스프라이트 설정
  private static readonly SPRITE_CONFIG: EnemySpriteConfig = {
    assetPath: '/assets/dokkaebi-walk.png',
    totalWidth: 384, // 32 * 12 frames
    height: 32,
    frameCount: 12,
    scale: 1.5, // 약간 크게 표시
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return DokkaebiEnemy.SPRITE_CONFIG;
  }

  protected getEnemyType(): string {
    return 'dokkaebi';
  }

  /**
   * 도깨비 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    return BaseEnemy.preloadSpriteType('dokkaebi', DokkaebiEnemy.SPRITE_CONFIG);
  }
}
