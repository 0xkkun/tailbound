/**
 * 탈령 적 - 빠른 암살자형 (낮은 체력, 높은 데미지)
 */

import { ENEMY_BALANCE } from '@/config/balance.config';
import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class MaskEnemy extends BaseEnemy {
  // 탈령 스프라이트 설정 (티어별)
  private static readonly SPRITE_CONFIGS: Record<EnemyTier, EnemySpriteConfig> = {
    normal: {
      assetPath: '/assets/enemy/mask-red-walk.png',
      totalWidth: 352, // 32 * 11 frames
      height: 32,
      frameCount: 11,
      scale: 2.5, // 기본 크기
    },
    elite: {
      assetPath: '/assets/enemy/mask-green-walk.png',
      totalWidth: 352, // 32 * 11 frames
      height: 32,
      frameCount: 11,
      scale: 3.0, // 20% 크게
    },
    boss: {
      assetPath: '/assets/enemy/mask-green-walk.png',
      totalWidth: 352, // 32 * 11 frames
      height: 32,
      frameCount: 11,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);

    // 탈령 고유 스탯: 낮은 체력, 매우 빠름, 높은 데미지
    // balance.config.ts의 티어 기본값에 타입별 배율 적용
    const baseStats = ENEMY_BALANCE[tier];
    this.health = Math.floor(baseStats.health * 0.6); // 기본보다 40% 낮음
    this.maxHealth = this.health;
    this.speed = 150; // 기본보다 50% 빠름 (가장 빠른 적)
    this.damage = Math.floor(baseStats.damage * 1.5); // 기본보다 50% 높음 (가장 아픈 적)

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'elite' ? 1.2 : tier === 'boss' ? 1.4 : 1;
    this.radius = 28 * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return MaskEnemy.SPRITE_CONFIGS[this.tier];
  }

  protected getEnemyType(): string {
    return `mask_${this.tier}`;
  }

  /**
   * 그림자 커스터마이즈 - 빠른 암살자형이므로 그림자를 작고 날렵하게
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 1.1, this.radius * 0.7, this.radius * 0.25);
    this.shadow.fill({ color: 0x000000, alpha: 0.38 });
  }

  /**
   * 탈령 스프라이트 preload (모든 티어)
   */
  public static async preloadSprites(): Promise<void> {
    await Promise.all([
      BaseEnemy.preloadSpriteType('mask_normal', MaskEnemy.SPRITE_CONFIGS.normal),
      BaseEnemy.preloadSpriteType('mask_elite', MaskEnemy.SPRITE_CONFIGS.elite),
      BaseEnemy.preloadSpriteType('mask_boss', MaskEnemy.SPRITE_CONFIGS.boss),
    ]);
  }
}
