import { CDN_BASE_URL } from '@config/assets.config';
/**
 * 수귀 적 - 물속에서 나온 유령형
 */
import { ENEMY_TYPE_BALANCE, FIELD_ENEMY_BALANCE } from '@config/balance.config';
import type { FieldEnemyTier } from '@game/data/enemies';
import { audioManager } from '@services/audioManager';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class WaterGhostEnemy extends BaseEnemy {
  // 수귀 스프라이트 설정 (티어별 - 크기만 변경)
  private static readonly SPRITE_CONFIGS: Record<FieldEnemyTier, EnemySpriteConfig> = {
    low: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/water-ghost-walk.png`,
      totalWidth: 256, // 32 * 8 frames
      height: 32,
      frameCount: 8,
      scale: 2.5, // 기본 크기
    },
    medium: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/water-ghost-walk.png`,
      totalWidth: 256, // 32 * 8 frames
      height: 32,
      frameCount: 8,
      scale: 3.0, // 20% 크게
    },
    high: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/water-ghost-walk.png`,
      totalWidth: 256, // 32 * 8 frames
      height: 32,
      frameCount: 8,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: FieldEnemyTier = 'medium') {
    super(id, x, y, 'field', tier);

    // 수귀 고유 스탯: 낮은 체력, 빠른 속도
    const baseStats = FIELD_ENEMY_BALANCE[tier];
    const typeConfig = ENEMY_TYPE_BALANCE.waterGhost;

    this.health = Math.floor(baseStats.health * typeConfig.healthMultiplier);
    this.maxHealth = this.health;
    this.speed = typeConfig.speed;
    this.damage = Math.floor(baseStats.damage * typeConfig.damageMultiplier);

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'medium' ? 1.2 : tier === 'high' ? 1.4 : 1;
    this.radius = typeConfig.radius * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return WaterGhostEnemy.SPRITE_CONFIGS[this.getFieldTier()];
  }

  protected getEnemyType(): string {
    return `water_ghost_${this.getFieldTier()}`;
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
   * 유령 전용 사망 사운드 재생
   */
  protected playDeathSound(): void {
    audioManager.playEnemyGhostDeathSound();
  }

  /**
   * 수귀 스프라이트 preload (모든 티어)
   */
  public static async preloadSprites(): Promise<void> {
    await Promise.all([
      BaseEnemy.preloadSpriteType('water_ghost_low', WaterGhostEnemy.SPRITE_CONFIGS.low),
      BaseEnemy.preloadSpriteType('water_ghost_medium', WaterGhostEnemy.SPRITE_CONFIGS.medium),
      BaseEnemy.preloadSpriteType('water_ghost_high', WaterGhostEnemy.SPRITE_CONFIGS.high),
    ]);
  }
}
