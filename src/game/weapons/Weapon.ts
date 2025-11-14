/**
 * 무기 베이스 클래스
 */

import type { AoEEffect } from '@game/entities/AoEEffect';
import type { BaseEnemy } from '@game/entities/enemies';
import type { MeleeSwing } from '@game/entities/MeleeSwing';
import type { Player } from '@game/entities/Player';
import type { Projectile } from '@game/entities/Projectile';
import type { WaterBottle } from '@game/entities/WaterBottle';
import type { WaterSplash } from '@game/entities/WaterSplash';
import type { Vector2 } from '@type/game.types';

// 무기가 발사할 수 있는 엔티티 타입들
export type WeaponEntity = Projectile | AoEEffect | MeleeSwing | WaterSplash | WaterBottle;

export abstract class Weapon {
  // 무기 정보
  public readonly id: string; // 무기 고유 ID (Analytics용)
  public name: string;
  public level: number = 1;

  // 스텟
  public damage: number;
  public cooldown: number; // 초 단위
  protected cooldownTimer: number = 0;

  constructor(id: string, name: string, damage: number, cooldown: number) {
    this.id = id;
    this.name = name;
    this.damage = damage;
    this.cooldown = cooldown;
  }

  /**
   * 무기 업데이트 (쿨다운 감소)
   * @param deltaTime 델타 타임
   */
  public update(deltaTime: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= deltaTime;
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
   * @param player 플레이어 (쿨다운 배율 적용용)
   */
  protected resetCooldown(player?: Player): void {
    // 플레이어 쿨다운 배율 적용 (기본 + 임시)
    const cooldownMultiplier = player?.getFinalCooldownMultiplier?.() ?? 1.0;
    this.cooldownTimer = this.cooldown * cooldownMultiplier;
  }

  /**
   * 레벨업
   */
  public levelUp(): void {
    this.level++;
    // 서브클래스에서 오버라이드하여 레벨업 효과 구현
  }
}
