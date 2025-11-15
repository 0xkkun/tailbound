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
import type { Container } from 'pixi.js';

// 무기가 발사할 수 있는 엔티티 타입들
export type WeaponEntity = Projectile | AoEEffect | MeleeSwing | WaterSplash | WaterBottle;

/**
 * 무기 생명주기 인터페이스
 * 진화 시 cleanup 및 initialization 로직을 정의
 */
export interface WeaponLifecycle {
  /**
   * 진화 전 정리 작업 (기존 무기의 엔티티 제거 등)
   * @param gameLayer 게임 레이어 (엔티티 제거용)
   */
  onBeforeEvolution?(gameLayer: Container): void;

  /**
   * 진화 후 초기화 작업 (새로운 엔티티 생성 등)
   * @param gameLayer 게임 레이어 (엔티티 추가용)
   */
  onAfterEvolution?(gameLayer: Container): Promise<void>;
}

export abstract class Weapon implements WeaponLifecycle {
  // 무기 정보
  public readonly id: string; // 무기 고유 ID (Analytics용)
  public name: string;
  public level: number = 1;
  public isEvolved: boolean = false; // 진화 여부

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
   * 진화 전 정리 작업 (기본 구현 - 하위 클래스에서 오버라이드)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onBeforeEvolution?(gameLayer: unknown): void {
    // 기본 구현 없음 - 필요한 무기만 오버라이드
  }

  /**
   * 진화 후 초기화 작업 (기본 구현 - 하위 클래스에서 오버라이드)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async onAfterEvolution?(gameLayer: unknown): Promise<void> {
    // 기본 구현 없음 - 필요한 무기만 오버라이드
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
