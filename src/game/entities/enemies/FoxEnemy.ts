/**
 * 여우 적 - 민첩한 중거리형
 */

import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class FoxEnemy extends BaseEnemy {
  // 여우 스프라이트 설정 (티어별)
  private static readonly SPRITE_CONFIGS: Record<EnemyTier, EnemySpriteConfig> = {
    normal: {
      assetPath: '/assets/enemy/fox-orange-walk.png',
      totalWidth: 224, // 32 * 7 frames
      height: 32,
      frameCount: 7,
      scale: 2.5, // 기본 크기
    },
    elite: {
      assetPath: '/assets/enemy/fox-white-walk.png',
      totalWidth: 224, // 32 * 7 frames
      height: 32,
      frameCount: 7,
      scale: 3.0, // 20% 크게
    },
    boss: {
      assetPath: '/assets/enemy/fox-white-walk.png',
      totalWidth: 224, // 32 * 7 frames
      height: 32,
      frameCount: 7,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);

    // 여우 고유 스탯: 중간 체력, 빠른 속도
    const tierMultiplier = tier === 'elite' ? 3.5 : tier === 'boss' ? 15 : 1;
    this.health = 35 * tierMultiplier; // 균형잡힌 체력
    this.maxHealth = this.health;
    this.speed = 120; // 빠른 편
    this.damage = 10 * tierMultiplier; // 중간 데미지

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'elite' ? 1.2 : tier === 'boss' ? 1.4 : 1;
    this.radius = 30 * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return FoxEnemy.SPRITE_CONFIGS[this.tier];
  }

  protected getEnemyType(): string {
    return `fox_${this.tier}`;
  }

  /**
   * 그림자 커스터마이즈 - 민첩한 몬스터이므로 그림자를 적당히
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 0.9, this.radius * 0.75, this.radius * 0.28);
    this.shadow.fill({ color: 0x000000, alpha: 0.32 });
  }

  /**
   * 여우 스프라이트 preload (모든 티어)
   */
  public static async preloadSprites(): Promise<void> {
    await Promise.all([
      BaseEnemy.preloadSpriteType('fox_normal', FoxEnemy.SPRITE_CONFIGS.normal),
      BaseEnemy.preloadSpriteType('fox_elite', FoxEnemy.SPRITE_CONFIGS.elite),
      BaseEnemy.preloadSpriteType('fox_boss', FoxEnemy.SPRITE_CONFIGS.boss),
    ]);
  }
}
