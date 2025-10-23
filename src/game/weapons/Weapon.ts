/**
 * 무기 베이스 클래스
 */

import type { AoEEffect } from '@/game/entities/AoEEffect';
import type { BaseEnemy } from '@/game/entities/enemies';
import type { MeleeSwing } from '@/game/entities/MeleeSwing';
import type { Player } from '@/game/entities/Player';
import type { Projectile } from '@/game/entities/Projectile';
import type { Vector2 } from '@/types/game.types';

// 무기가 발사할 수 있는 엔티티 타입들
export type WeaponEntity = Projectile | AoEEffect | MeleeSwing;

export abstract class Weapon {
  // 무기 정보
  public name: string;
  public level: number = 1;

  // 스텟
  public damage: number;
  public cooldown: number; // 초 단위
  protected cooldownTimer: number = 0;

  constructor(name: string, damage: number, cooldown: number) {
    this.name = name;
    this.damage = damage;
    this.cooldown = cooldown;
  }

  /**
   * 무기 업데이트 (쿨다운 감소)
   * @param deltaTime 델타 타임
   * @param player 플레이어 (선정 시스템용, optional)
   */
  public update(deltaTime: number, player?: Player): void {
    if (this.cooldownTimer > 0) {
      // 선정 시스템: 1초 이상 정지 시 쿨타임 -20% 보너스
      let cooldownMultiplier = 1.0;
      if (player?.meditationEnabled && player.stillTime >= 1.0) {
        cooldownMultiplier = 1.2; // 20% 빠르게 감소
      }

      this.cooldownTimer -= deltaTime * cooldownMultiplier;
    }
  }

  /**
   * 발사 가능 여부
   */
  public canFire(): boolean {
    return this.cooldownTimer <= 0;
  }

  /**
   * 무기 발사 (추상 메서드)
   * @param playerPos 플레이어 위치
   * @param enemies 적 배열
   * @param player 플레이어 객체 (치명타, 흡혈 등 적용용)
   * @returns 생성된 엔티티 배열 (투사체, AoE, 근접 등)
   */
  public abstract fire(
    playerPos: Vector2,
    enemies: BaseEnemy[],
    player?: Player
  ): WeaponEntity[] | Promise<WeaponEntity[]>;

  /**
   * 쿨다운 리셋
   */
  protected resetCooldown(): void {
    this.cooldownTimer = this.cooldown;
  }

  /**
   * 레벨업
   */
  public levelUp(): void {
    this.level++;
    // 서브클래스에서 오버라이드하여 레벨업 효과 구현
  }
}
