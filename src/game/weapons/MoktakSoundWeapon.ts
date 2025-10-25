/**
 * 목탁 소리 무기
 *
 * 타입: 광역 (AoE)
 * 주기적으로 발동되는 음파 공격
 */

import { calculateWeaponStats } from '@/game/data/weapons';
import { AoEEffect } from '@/game/entities/AoEEffect';
import type { BaseEnemy } from '@/game/entities/enemies';
import type { Player } from '@/game/entities/Player';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

// 목탁 소리 무기 상수
const MOKTAK_CONSTANTS = {
  SPRITE: {
    PATH: '/assets/weapon/mocktak.png',
    FRAME_WIDTH: 120,
    FRAME_HEIGHT: 120,
    TOTAL_FRAMES: 30,
    COLUMNS: 6,
  },
  COLOR: 0xffa500, // 주황색
  TICK_INTERVAL: 0.5, // 0.5초마다 데미지
} as const;

export class MoktakSoundWeapon extends Weapon {
  private aoeRadius: number = 150;

  constructor() {
    const stats = calculateWeaponStats('moktak_sound', 1);
    super('목탁 소리', stats.damage, stats.cooldown);
  }

  /**
   * 광역 공격 발동
   */

  public async fire(
    playerPos: Vector2,
    _enemies: BaseEnemy[],
    player?: Player
  ): Promise<AoEEffect[]> {
    if (!this.canFire()) {
      return [];
    }

    // 플레이어 스탯 적용
    let finalDamage = this.damage;
    let finalRadius = this.aoeRadius;

    if (player) {
      // 치명타 판정 및 데미지 배율 적용
      const critResult = player.rollCritical();
      finalDamage = this.damage * critResult.damageMultiplier;

      // 범위 배율 적용
      finalRadius = this.aoeRadius * player.areaMultiplier;
    }

    // 하나의 광역 이펙트 생성
    const effect = new AoEEffect(
      playerPos.x,
      playerPos.y,
      finalRadius,
      finalDamage,
      MOKTAK_CONSTANTS.COLOR
    );

    // 목탁 스프라이트 로드
    await effect.loadSpriteSheet(
      MOKTAK_CONSTANTS.SPRITE.PATH,
      MOKTAK_CONSTANTS.SPRITE.FRAME_WIDTH,
      MOKTAK_CONSTANTS.SPRITE.FRAME_HEIGHT,
      MOKTAK_CONSTANTS.SPRITE.TOTAL_FRAMES,
      MOKTAK_CONSTANTS.SPRITE.COLUMNS
    );

    // 틱 데미지 설정
    effect.setTickInterval(MOKTAK_CONSTANTS.TICK_INTERVAL);

    this.resetCooldown();

    console.log(
      `🔔 목탁 소리 발동! (범위: ${finalRadius.toFixed(0)}px, 데미지: ${finalDamage.toFixed(1)})`
    );

    return [effect];
  }

  /**
   * 레벨업
   */
  public levelUp(): void {
    super.levelUp();

    const stats = calculateWeaponStats('moktak_sound', this.level);
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;

    // 레벨업 효과
    if (this.level % 2 === 0) {
      this.aoeRadius += 20; // 짝수 레벨마다 범위 +20
    }

    console.log(`🔔 목탁 소리 레벨 ${this.level}! (범위: ${this.aoeRadius}px)`);
  }

  /**
   * 현재 범위 반환
   */
  public getRadius(): number {
    return this.aoeRadius;
  }
}
