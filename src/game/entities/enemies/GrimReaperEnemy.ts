import { CDN_BASE_URL } from '@config/assets.config';
/**
 * 저승사자 적 - 강력한 탱커형
 */
import { ENEMY_TYPE_BALANCE, FIELD_ENEMY_BALANCE } from '@config/balance.config';
import type { FieldEnemyTier } from '@game/data/enemies';
import { audioManager } from '@services/audioManager';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class GrimReaperEnemy extends BaseEnemy {
  // 저승사자 스프라이트 설정 (티어별 - 크기만 변경)
  private static readonly SPRITE_CONFIGS: Record<FieldEnemyTier, EnemySpriteConfig> = {
    low: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/grim-reaper-walk.png`,
      totalWidth: 384, // 32 * 12 frames
      height: 32,
      frameCount: 12,
      scale: 2.5, // 기본 크기
    },
    medium: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/grim-reaper-walk.png`,
      totalWidth: 384, // 32 * 12 frames
      height: 32,
      frameCount: 12,
      scale: 3.0, // 20% 크게
    },
    high: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/grim-reaper-walk.png`,
      totalWidth: 384, // 32 * 12 frames
      height: 32,
      frameCount: 12,
      scale: 3.5, // 40% 크게
    },
  };

  constructor(id: string, x: number, y: number, tier: FieldEnemyTier = 'medium') {
    super(id, x, y, 'field', tier);

    // 저승사자 고유 스탯: 빠른 암살자형 - 낮은 체력, 매우 빠름, 강한 공격
    const baseStats = FIELD_ENEMY_BALANCE[tier];
    const typeConfig = ENEMY_TYPE_BALANCE.grimReaper;

    this.health = Math.floor(baseStats.health * typeConfig.healthMultiplier);
    this.maxHealth = this.health;
    this.speed = typeConfig.speed;
    this.damage = Math.floor(baseStats.damage * typeConfig.damageMultiplier);

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'medium' ? 1.2 : tier === 'high' ? 1.4 : 1;
    this.radius = typeConfig.radius * radiusMultiplier;
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return GrimReaperEnemy.SPRITE_CONFIGS[this.getFieldTier()];
  }

  protected getEnemyType(): string {
    return `grim_reaper_${this.getFieldTier()}`;
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
   * 유령 전용 사망 사운드 재생
   */
  protected playDeathSound(): void {
    audioManager.playEnemyGhostDeathSound();
  }

  /**
   * 저승사자 스프라이트 preload (모든 티어)
   */
  public static async preloadSprites(): Promise<void> {
    await Promise.all([
      BaseEnemy.preloadSpriteType('grim_reaper_low', GrimReaperEnemy.SPRITE_CONFIGS.low),
      BaseEnemy.preloadSpriteType('grim_reaper_medium', GrimReaperEnemy.SPRITE_CONFIGS.medium),
      BaseEnemy.preloadSpriteType('grim_reaper_high', GrimReaperEnemy.SPRITE_CONFIGS.high),
    ]);
  }
}
