import { CDN_BASE_URL } from '@config/assets.config';
/**
 * 탈령 적 - 빠른 암살자형 (낮은 체력, 높은 데미지)
 */
import { ENEMY_TYPE_BALANCE, FIELD_ENEMY_BALANCE } from '@config/balance.config';
import type { FieldEnemyTier } from '@game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class MaskEnemy extends BaseEnemy {
  // 탈령 스프라이트 설정 (티어별)
  private static readonly SPRITE_CONFIGS: Record<FieldEnemyTier, EnemySpriteConfig> = {
    low: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/mask-red-walk.png`,
      totalWidth: 352, // 32 * 11 frames
      height: 32,
      frameCount: 11,
      scale: 2.5, // 기본 크기
    },
    medium: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/mask-green-walk.png`,
      totalWidth: 352, // 32 * 11 frames
      height: 32,
      frameCount: 11,
      scale: 3.0, // 20% 크게
    },
    high: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/mask-green-walk.png`,
      totalWidth: 352, // 32 * 11 frames
      height: 32,
      frameCount: 11,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: FieldEnemyTier = 'medium') {
    super(id, x, y, 'field', tier);

    // 탈령 고유 스탯: 낮은 체력, 빠른 속도, 높은 데미지
    const baseStats = FIELD_ENEMY_BALANCE[tier];
    const typeConfig = ENEMY_TYPE_BALANCE.mask;

    this.health = Math.floor(baseStats.health * typeConfig.healthMultiplier);
    this.maxHealth = this.health;
    this.speed = typeConfig.speed;
    this.damage = Math.floor(baseStats.damage * typeConfig.damageMultiplier);

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'medium' ? 1.2 : tier === 'high' ? 1.4 : 1;
    this.radius = typeConfig.radius * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return MaskEnemy.SPRITE_CONFIGS[this.getFieldTier()];
  }

  protected getEnemyType(): string {
    return `mask_${this.getFieldTier()}`;
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
      BaseEnemy.preloadSpriteType('mask_low', MaskEnemy.SPRITE_CONFIGS.low),
      BaseEnemy.preloadSpriteType('mask_medium', MaskEnemy.SPRITE_CONFIGS.medium),
      BaseEnemy.preloadSpriteType('mask_high', MaskEnemy.SPRITE_CONFIGS.high),
    ]);
  }
}
