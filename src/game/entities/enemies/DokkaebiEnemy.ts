/**
 * 도깨비 적 - 높은 체력의 탱커형
 */

import { ENEMY_BALANCE } from '@/config/balance.config';
import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class DokkaebiEnemy extends BaseEnemy {
  // 도깨비 스프라이트 설정
  private static readonly SPRITE_CONFIG: EnemySpriteConfig = {
    assetPath: '/assets/enemy/dokkaebi-walk.png',
    totalWidth: 352, // 32 * 11 frames
    height: 32,
    frameCount: 11,
    scale: 2.5,
  };

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);

    // 도깨비 고유 스탯: 높은 체력, 느린 이동
    // balance.config.ts의 티어 기본값에 타입별 배율 적용
    const baseStats = ENEMY_BALANCE[tier];
    this.health = Math.floor(baseStats.health * 1.67); // 기본보다 67% 높음
    this.maxHealth = this.health;
    this.speed = 75; // 기본보다 25% 느림
    this.damage = Math.floor(baseStats.damage * 1.2); // 기본보다 20% 높음
    this.radius = 35; // 큰 히트박스
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return DokkaebiEnemy.SPRITE_CONFIG;
  }

  protected getEnemyType(): string {
    return 'dokkaebi';
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
   * 도깨비 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    return BaseEnemy.preloadSpriteType('dokkaebi', DokkaebiEnemy.SPRITE_CONFIG);
  }
}
