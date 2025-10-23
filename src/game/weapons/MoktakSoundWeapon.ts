/**
 * 목탁 소리 무기
 *
 * 타입: 광역 (AoE)
 * 주기적으로 발동되는 음파 공격
 */

import { calculateWeaponStats } from '@/game/data/weapons';
import { AoEEffect } from '@/game/entities/AoEEffect';
import type { BaseEnemy } from '@/game/entities/enemies';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

export class MoktakSoundWeapon extends Weapon {
  private aoeRadius: number = 150;

  constructor() {
    const stats = calculateWeaponStats('moktak_sound', 1);
    super('목탁 소리', stats.damage, stats.cooldown);
  }

  /**
   * 광역 공격 발동
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async fire(playerPos: Vector2, _enemies: BaseEnemy[]): Promise<AoEEffect[]> {
    if (!this.canFire()) {
      return [];
    }

    // 하나의 광역 이펙트 생성
    const effect = new AoEEffect(
      playerPos.x,
      playerPos.y,
      this.aoeRadius,
      this.damage,
      0xffa500 // 주황색 (목탁 소리)
    );

    // 목탁 스프라이트 로드 (6x5 = 30 프레임, 각 프레임 120x120)
    await effect.loadSpriteSheet('/assets/weapon/mocktak.png', 120, 120, 30, 6);

    this.resetCooldown();

    console.log(`🔔 목탁 소리 발동! (범위: ${this.aoeRadius}px)`);

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
