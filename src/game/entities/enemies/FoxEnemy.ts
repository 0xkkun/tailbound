import { CDN_BASE_URL } from '@config/assets.config';
/**
 * 여우 적 - 민첩한 중거리형
 */
import { ENEMY_TYPE_BALANCE, FIELD_ENEMY_BALANCE } from '@config/balance.config';
import type { FieldEnemyTier } from '@game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class FoxEnemy extends BaseEnemy {
  // 여우 스프라이트 설정 (티어별)
  private static readonly SPRITE_CONFIGS: Record<FieldEnemyTier, EnemySpriteConfig> = {
    low: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/fox-orange-walk.png`,
      totalWidth: 224, // 32 * 7 frames
      height: 32,
      frameCount: 7,
      scale: 2.5, // 기본 크기
    },
    medium: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/fox-white-walk.png`,
      totalWidth: 224, // 32 * 7 frames
      height: 32,
      frameCount: 7,
      scale: 3.0, // 20% 크게
    },
    high: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/fox-white-walk.png`,
      totalWidth: 224, // 32 * 7 frames
      height: 32,
      frameCount: 7,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: FieldEnemyTier = 'medium') {
    super(id, x, y, 'field', tier);

    // 여우 고유 스탯: 중간 체력, 빠른 속도
    const baseStats = FIELD_ENEMY_BALANCE[tier];
    const typeConfig = ENEMY_TYPE_BALANCE.fox;

    this.health = Math.floor(baseStats.health * typeConfig.healthMultiplier);
    this.maxHealth = this.health;
    this.speed = typeConfig.speed;
    this.damage = Math.floor(baseStats.damage * typeConfig.damageMultiplier);

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'medium' ? 1.2 : tier === 'high' ? 1.4 : 1;
    this.radius = typeConfig.radius * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return FoxEnemy.SPRITE_CONFIGS[this.getFieldTier()];
  }

  protected getEnemyType(): string {
    return `fox_${this.getFieldTier()}`;
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
      BaseEnemy.preloadSpriteType('fox_low', FoxEnemy.SPRITE_CONFIGS.low),
      BaseEnemy.preloadSpriteType('fox_medium', FoxEnemy.SPRITE_CONFIGS.medium),
      BaseEnemy.preloadSpriteType('fox_high', FoxEnemy.SPRITE_CONFIGS.high),
    ]);
  }
}
