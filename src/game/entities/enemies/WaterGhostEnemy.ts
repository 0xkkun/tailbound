/**
 * 수귀 적 - 물속에서 나온 유령형
 */

import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class WaterGhostEnemy extends BaseEnemy {
  // 수귀 스프라이트 설정 (티어별 - 크기만 변경)
  private static readonly SPRITE_CONFIGS: Record<EnemyTier, EnemySpriteConfig> = {
    normal: {
      assetPath: '/assets/enemy/water-ghost-walk.png',
      totalWidth: 256, // 32 * 8 frames
      height: 32,
      frameCount: 8,
      scale: 2.5, // 기본 크기
    },
    elite: {
      assetPath: '/assets/enemy/water-ghost-walk.png',
      totalWidth: 256, // 32 * 8 frames
      height: 32,
      frameCount: 8,
      scale: 3.0, // 20% 크게
    },
    boss: {
      assetPath: '/assets/enemy/water-ghost-walk.png',
      totalWidth: 256, // 32 * 8 frames
      height: 32,
      frameCount: 8,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);

    // 수귀 고유 스탯: 낮은 체력, 빠른 속도
    const tierMultiplier = tier === 'elite' ? 3.5 : tier === 'boss' ? 15 : 1;
    this.health = 25 * tierMultiplier; // 낮은 체력
    this.maxHealth = this.health;
    this.speed = 110; // 빠른 속도
    this.damage = 9 * tierMultiplier; // 낮은 데미지

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'elite' ? 1.2 : tier === 'boss' ? 1.4 : 1;
    this.radius = 27 * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return WaterGhostEnemy.SPRITE_CONFIGS[this.tier];
  }

  protected getEnemyType(): string {
    return `water_ghost_${this.tier}`;
  }

  /**
   * 그림자 커스터마이즈 - 유령이므로 그림자를 흐릿하고 작게
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 0.9, this.radius * 0.6, this.radius * 0.22);
    this.shadow.fill({ color: 0x000000, alpha: 0.25 });
  }

  /**
   * 수귀 스프라이트 preload (모든 티어)
   */
  public static async preloadSprites(): Promise<void> {
    await Promise.all([
      BaseEnemy.preloadSpriteType('water_ghost_normal', WaterGhostEnemy.SPRITE_CONFIGS.normal),
      BaseEnemy.preloadSpriteType('water_ghost_elite', WaterGhostEnemy.SPRITE_CONFIGS.elite),
      BaseEnemy.preloadSpriteType('water_ghost_boss', WaterGhostEnemy.SPRITE_CONFIGS.boss),
    ]);
  }
}
