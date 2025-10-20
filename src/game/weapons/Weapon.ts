/**
 * 무기 베이스 클래스
 */

import type { AoEEffect } from '@/game/entities/AoEEffect';
import type { BaseEnemy } from '@/game/entities/enemies';
import type { MeleeSwing } from '@/game/entities/MeleeSwing';
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
   * @returns 생성된 엔티티 배열 (투사체, AoE, 근접 등)
   */
  public abstract fire(
    playerPos: Vector2,
    enemies: BaseEnemy[]
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
