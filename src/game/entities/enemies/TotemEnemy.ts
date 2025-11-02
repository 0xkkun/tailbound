/**
 * 토템 적 - 느리지만 강인한 마법형
 */

import { ENEMY_TYPE_BALANCE, FIELD_ENEMY_BALANCE } from '@/config/balance.config';
import type { FieldEnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class TotemEnemy extends BaseEnemy {
  // 토템 스프라이트 설정 (티어별 - 크기만 변경)
  private static readonly SPRITE_CONFIGS: Record<FieldEnemyTier, EnemySpriteConfig> = {
    low: {
      assetPath: '/assets/enemy/totem-walk.png',
      totalWidth: 416, // 32 * 13 frames
      height: 32,
      frameCount: 13,
      scale: 2.5, // 기본 크기
    },
    medium: {
      assetPath: '/assets/enemy/totem-walk.png',
      totalWidth: 416, // 32 * 13 frames
      height: 32,
      frameCount: 13,
      scale: 3.0, // 20% 크게
    },
    high: {
      assetPath: '/assets/enemy/totem-walk.png',
      totalWidth: 416, // 32 * 13 frames
      height: 32,
      frameCount: 13,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: FieldEnemyTier = 'medium') {
    super(id, x, y, 'field', tier);

    // 토템 고유 스탯: 높은 체력, 매우 느림, 중간 데미지
    const baseStats = FIELD_ENEMY_BALANCE[tier];
    const typeConfig = ENEMY_TYPE_BALANCE.totem;

    this.health = Math.floor(baseStats.health * typeConfig.healthMultiplier);
    this.maxHealth = this.health;
    this.speed = typeConfig.speed;
    this.damage = Math.floor(baseStats.damage * typeConfig.damageMultiplier);

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'medium' ? 1.2 : tier === 'high' ? 1.4 : 1;
    this.radius = typeConfig.radius * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return TotemEnemy.SPRITE_CONFIGS[this.getFieldTier()];
  }

  protected getEnemyType(): string {
    return `totem_${this.getFieldTier()}`;
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
      BaseEnemy.preloadSpriteType('totem_low', TotemEnemy.SPRITE_CONFIGS.low),
      BaseEnemy.preloadSpriteType('totem_medium', TotemEnemy.SPRITE_CONFIGS.medium),
      BaseEnemy.preloadSpriteType('totem_high', TotemEnemy.SPRITE_CONFIGS.high),
    ]);
  }
}
