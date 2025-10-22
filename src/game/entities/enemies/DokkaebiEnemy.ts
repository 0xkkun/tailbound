/**
 * 도깨비 적 - 높은 체력의 탱커형
 */

import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class DokkaebiEnemy extends BaseEnemy {
  // 도깨비 스프라이트 설정
  private static readonly SPRITE_CONFIG: EnemySpriteConfig = {
    assetPath: '/assets/dokkaebi-walk.png',
    totalWidth: 352, // 32 * 11 frames
    height: 32,
    frameCount: 11,
    scale: 2.5,
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);

    // 도깨비 고유 스탯: 높은 체력, 느린 이동
    const tierMultiplier = tier === 'elite' ? 3.5 : tier === 'boss' ? 15 : 1;
    this.health = 50 * tierMultiplier; // 기본보다 67% 높음
    this.maxHealth = this.health;
    this.speed = 75; // 기본보다 25% 느림
    this.damage = 12 * tierMultiplier; // 기본보다 20% 높음
    this.radius = 35; // 큰 히트박스
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
