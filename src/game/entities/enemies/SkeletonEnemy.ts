/**
 * 스켈레톤 적 - 빠르고 약한 유리대포형
 */

import { ENEMY_BALANCE } from '@/config/balance.config';
import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class SkeletonEnemy extends BaseEnemy {
  // 스켈레톤 스프라이트 설정 (티어별 - 크기만 변경)
  private static readonly SPRITE_CONFIGS: Record<EnemyTier, EnemySpriteConfig> = {
    normal: {
      assetPath: '/assets/enemy/skeleton-walk.png',
      totalWidth: 286, // 22 * 13 frames
      height: 33,
      frameCount: 13,
      scale: 2.5, // 기본 크기
    },
    elite: {
      assetPath: '/assets/enemy/skeleton-walk.png',
      totalWidth: 286, // 22 * 13 frames
      height: 33,
      frameCount: 13,
      scale: 3.0, // 20% 크게
    },
    boss: {
      assetPath: '/assets/enemy/skeleton-walk.png',
      totalWidth: 286, // 22 * 13 frames
      height: 33,
      frameCount: 13,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);

    // 스켈레톤 고유 스탯: 빠르고 약함
    // balance.config.ts의 티어 기본값에 타입별 배율 적용
    const baseStats = ENEMY_BALANCE[tier];
    this.health = Math.floor(baseStats.health * 0.67); // 기본보다 33% 낮음
    this.maxHealth = this.health;
    this.speed = 130; // 기본보다 30% 빠름
    this.damage = Math.floor(baseStats.damage * 0.8); // 기본보다 20% 낮음

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'elite' ? 1.2 : tier === 'boss' ? 1.4 : 1;
    this.radius = 25 * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return SkeletonEnemy.SPRITE_CONFIGS[this.tier];
  }

  protected getEnemyType(): string {
    return `skeleton_${this.tier}`;
  }

  /**
   * 그림자 커스터마이즈 - 작고 빠른 몬스터이므로 그림자도 작게
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 1.4, this.radius * 0.65, this.radius * 0.23);
    this.shadow.fill({ color: 0x000000, alpha: 0.35 });
  }

  /**
   * 스켈레톤 스프라이트 preload (모든 티어)
   */
  public static async preloadSprites(): Promise<void> {
    await Promise.all([
      BaseEnemy.preloadSpriteType('skeleton_normal', SkeletonEnemy.SPRITE_CONFIGS.normal),
      BaseEnemy.preloadSpriteType('skeleton_elite', SkeletonEnemy.SPRITE_CONFIGS.elite),
      BaseEnemy.preloadSpriteType('skeleton_boss', SkeletonEnemy.SPRITE_CONFIGS.boss),
    ]);
  }
}
