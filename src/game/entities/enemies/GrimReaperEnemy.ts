/**
 * 저승사자 적 - 강력한 탱커형
 */

import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class GrimReaperEnemy extends BaseEnemy {
  // 저승사자 스프라이트 설정 (티어별 - 크기만 변경)
  private static readonly SPRITE_CONFIGS: Record<EnemyTier, EnemySpriteConfig> = {
    normal: {
      assetPath: '/assets/enemy/grim-reaper-walk.png',
      totalWidth: 384, // 32 * 12 frames
      height: 32,
      frameCount: 12,
      scale: 2.5, // 기본 크기
    },
    elite: {
      assetPath: '/assets/enemy/grim-reaper-walk.png',
      totalWidth: 384, // 32 * 12 frames
      height: 32,
      frameCount: 12,
      scale: 3.0, // 20% 크게
    },
    boss: {
      assetPath: '/assets/enemy/grim-reaper-walk.png',
      totalWidth: 384, // 32 * 12 frames
      height: 32,
      frameCount: 12,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);

    // 저승사자 고유 스탯: 빠른 암살자형 - 낮은 체력, 매우 빠름, 강한 공격
    const tierMultiplier = tier === 'elite' ? 3.5 : tier === 'boss' ? 15 : 1;
    this.health = 22 * tierMultiplier; // 낮은 체력 (유리몸)
    this.maxHealth = this.health;
    this.speed = 140; // 매우 빠름
    this.damage = 16 * tierMultiplier; // 강한 공격

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'elite' ? 1.2 : tier === 'boss' ? 1.4 : 1;
    this.radius = 28 * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return GrimReaperEnemy.SPRITE_CONFIGS[this.tier];
  }

  protected getEnemyType(): string {
    return `grim_reaper_${this.tier}`;
  }

  /**
   * 그림자 커스터마이즈 - 빠른 암살자형이므로 그림자를 작고 날렵하게
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 1.1, this.radius * 0.65, this.radius * 0.24);
    this.shadow.fill({ color: 0x000000, alpha: 0.38 });
  }

  /**
   * 저승사자 스프라이트 preload (모든 티어)
   */
  public static async preloadSprites(): Promise<void> {
    await Promise.all([
      BaseEnemy.preloadSpriteType('grim_reaper_normal', GrimReaperEnemy.SPRITE_CONFIGS.normal),
      BaseEnemy.preloadSpriteType('grim_reaper_elite', GrimReaperEnemy.SPRITE_CONFIGS.elite),
      BaseEnemy.preloadSpriteType('grim_reaper_boss', GrimReaperEnemy.SPRITE_CONFIGS.boss),
    ]);
  }
}
