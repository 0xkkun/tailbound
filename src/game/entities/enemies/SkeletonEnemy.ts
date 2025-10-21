/**
 * 스켈레톤 적
 */

import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class SkeletonEnemy extends BaseEnemy {
  // 스켈레톤 스프라이트 설정
  private static readonly SPRITE_CONFIG: EnemySpriteConfig = {
    assetPath: '/assets/skeleton_walk.png',
    totalWidth: 286,
    height: 33,
    frameCount: 13,
    scale: 2,
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return SkeletonEnemy.SPRITE_CONFIG;
  }

  protected getEnemyType(): string {
    return 'skeleton';
  }

  /**
   * 스켈레톤 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    return BaseEnemy.preloadSpriteType('skeleton', SkeletonEnemy.SPRITE_CONFIG);
  }
}
