/**
 * 도깨비 적 - 높은 체력의 탱커형
 */

import { ENEMY_TYPE_BALANCE, FIELD_ENEMY_BALANCE } from '@/config/balance.config';
import type { FieldEnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class DokkaebiEnemy extends BaseEnemy {
  // 도깨비 스프라이트 설정 (티어별)
  private static readonly SPRITE_CONFIGS: Record<FieldEnemyTier, EnemySpriteConfig> = {
    low: {
      assetPath: '/assets/enemy/dokkaebi-green-walk.png',
      totalWidth: 352, // 32 * 11 frames
      height: 32,
      frameCount: 11,
      scale: 2.5, // 기본 크기
    },
    medium: {
      assetPath: '/assets/enemy/dokkaebi-blue-walk.png',
      totalWidth: 352, // 32 * 11 frames
      height: 32,
      frameCount: 11,
      scale: 3.0, // 20% 크게
    },
    high: {
      assetPath: '/assets/enemy/dokkaebi-red-walk.png',
      totalWidth: 352, // 32 * 11 frames
      height: 32,
      frameCount: 11,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: FieldEnemyTier = 'medium') {
    super(id, x, y, 'field', tier);

    // 도깨비 고유 스탯: 높은 체력, 느린 이동
    const baseStats = FIELD_ENEMY_BALANCE[tier];
    const typeConfig = ENEMY_TYPE_BALANCE.dokkaebi;

    this.health = Math.floor(baseStats.health * typeConfig.healthMultiplier);
    this.maxHealth = this.health;
    this.speed = typeConfig.speed;
    this.damage = Math.floor(baseStats.damage * typeConfig.damageMultiplier);

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'medium' ? 1.2 : tier === 'high' ? 1.4 : 1;
    this.radius = typeConfig.radius * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return DokkaebiEnemy.SPRITE_CONFIGS[this.getFieldTier()];
  }

  protected getEnemyType(): string {
    return `dokkaebi_${this.getFieldTier()}`;
  }

  /**
   * 그림자 커스터마이즈 - 큰 탱커형이므로 그림자도 크게
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 0.85, this.radius * 0.85, this.radius * 0.3);
    this.shadow.fill({ color: 0x000000, alpha: 0.35 });
  }

  /**
   * 도깨비 스프라이트 preload (모든 티어)
   */
  public static async preloadSprites(): Promise<void> {
    await Promise.all([
      BaseEnemy.preloadSpriteType('dokkaebi_low', DokkaebiEnemy.SPRITE_CONFIGS.low),
      BaseEnemy.preloadSpriteType('dokkaebi_medium', DokkaebiEnemy.SPRITE_CONFIGS.medium),
      BaseEnemy.preloadSpriteType('dokkaebi_high', DokkaebiEnemy.SPRITE_CONFIGS.high),
    ]);
  }
}
