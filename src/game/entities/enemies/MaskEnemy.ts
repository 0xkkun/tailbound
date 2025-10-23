/**
 * 탈령 적 - 빠른 암살자형 (낮은 체력, 높은 데미지)
 */

import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class MaskEnemy extends BaseEnemy {
  // 탈령 스프라이트 설정
  private static readonly SPRITE_CONFIG: EnemySpriteConfig = {
    assetPath: '/assets/enemy/mask-walk.png',
    totalWidth: 352, // 32 * 11 frames
    height: 32,
    frameCount: 11,
    scale: 2.5,
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);

    // 탈령 고유 스탯: 낮은 체력, 매우 빠름, 높은 데미지
    const tierMultiplier = tier === 'elite' ? 3.5 : tier === 'boss' ? 15 : 1;
    this.health = 18 * tierMultiplier; // 기본보다 40% 낮음
    this.maxHealth = this.health;
    this.speed = 150; // 기본보다 50% 빠름 (가장 빠른 적)
    this.damage = 15 * tierMultiplier; // 기본보다 50% 높음 (가장 아픈 적)
    this.radius = 28; // 중간 히트박스
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return MaskEnemy.SPRITE_CONFIG;
  }

  protected getEnemyType(): string {
    return 'mask';
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
   * 탈령 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    return BaseEnemy.preloadSpriteType('mask', MaskEnemy.SPRITE_CONFIG);
  }
}
