/**
 * 토템 적 - 느리지만 강인한 마법형
 */

import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class TotemEnemy extends BaseEnemy {
  // 토템 스프라이트 설정 (티어별 - 크기만 변경)
  private static readonly SPRITE_CONFIGS: Record<EnemyTier, EnemySpriteConfig> = {
    normal: {
      assetPath: '/assets/enemy/totem-walk.png',
      totalWidth: 416, // 32 * 13 frames
      height: 32,
      frameCount: 13,
      scale: 2.5, // 기본 크기
    },
    elite: {
      assetPath: '/assets/enemy/totem-walk.png',
      totalWidth: 416, // 32 * 13 frames
      height: 32,
      frameCount: 13,
      scale: 3.0, // 20% 크게
    },
    boss: {
      assetPath: '/assets/enemy/totem-walk.png',
      totalWidth: 416, // 32 * 13 frames
      height: 32,
      frameCount: 13,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);

    // 토템 고유 스탯: 높은 체력, 매우 느림, 중간 데미지
    const tierMultiplier = tier === 'elite' ? 3.5 : tier === 'boss' ? 15 : 1;
    this.health = 60 * tierMultiplier; // 높은 체력
    this.maxHealth = this.health;
    this.speed = 50; // 매우 느림
    this.damage = 11 * tierMultiplier; // 중간 데미지

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'elite' ? 1.2 : tier === 'boss' ? 1.4 : 1;
    this.radius = 32 * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return TotemEnemy.SPRITE_CONFIGS[this.tier];
  }

  protected getEnemyType(): string {
    return `totem_${this.tier}`;
  }

  /**
   * 그림자 커스터마이즈 - 토템이므로 작고 어두운 그림자, 아래쪽에 배치
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 1.3, this.radius * 0.5, this.radius * 0.2);
    this.shadow.fill({ color: 0x000000, alpha: 0.45 });
  }

  /**
   * 토템 스프라이트 preload (모든 티어)
   */
  public static async preloadSprites(): Promise<void> {
    await Promise.all([
      BaseEnemy.preloadSpriteType('totem_normal', TotemEnemy.SPRITE_CONFIGS.normal),
      BaseEnemy.preloadSpriteType('totem_elite', TotemEnemy.SPRITE_CONFIGS.elite),
      BaseEnemy.preloadSpriteType('totem_boss', TotemEnemy.SPRITE_CONFIGS.boss),
    ]);
  }
}
