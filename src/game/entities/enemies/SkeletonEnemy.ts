/**
 * 스켈레톤 적 - 빠르고 약한 유리대포형
 */

import { ENEMY_TYPE_BALANCE, FIELD_ENEMY_BALANCE } from '@/config/balance.config';
import type { FieldEnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class SkeletonEnemy extends BaseEnemy {
  // 스켈레톤 스프라이트 설정 (티어별 - 크기만 변경)
  private static readonly SPRITE_CONFIGS: Record<FieldEnemyTier, EnemySpriteConfig> = {
    low: {
      assetPath: '/assets/enemy/skeleton-walk.png',
      totalWidth: 286, // 22 * 13 frames
      height: 33,
      frameCount: 13,
      scale: 2.5, // 기본 크기
    },
    medium: {
      assetPath: '/assets/enemy/skeleton-walk.png',
      totalWidth: 286, // 22 * 13 frames
      height: 33,
      frameCount: 13,
      scale: 3.0, // 20% 크게
    },
    high: {
      assetPath: '/assets/enemy/skeleton-walk.png',
      totalWidth: 286, // 22 * 13 frames
      height: 33,
      frameCount: 13,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: FieldEnemyTier = 'medium') {
    super(id, x, y, 'field', tier);

    // 스켈레톤 고유 스탯: 빠르고 약함
    const baseStats = FIELD_ENEMY_BALANCE[tier];
    const typeConfig = ENEMY_TYPE_BALANCE.skeleton;

    this.health = Math.floor(baseStats.health * typeConfig.healthMultiplier);
    this.maxHealth = this.health;
    this.speed = typeConfig.speed;
    this.damage = Math.floor(baseStats.damage * typeConfig.damageMultiplier);

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'medium' ? 1.2 : tier === 'high' ? 1.4 : 1;
    this.radius = typeConfig.radius * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return SkeletonEnemy.SPRITE_CONFIGS[this.getFieldTier()];
  }

  protected getEnemyType(): string {
    return `skeleton_${this.getFieldTier()}`;
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
      BaseEnemy.preloadSpriteType('skeleton_low', SkeletonEnemy.SPRITE_CONFIGS.low),
      BaseEnemy.preloadSpriteType('skeleton_medium', SkeletonEnemy.SPRITE_CONFIGS.medium),
      BaseEnemy.preloadSpriteType('skeleton_high', SkeletonEnemy.SPRITE_CONFIGS.high),
    ]);
  }
}
