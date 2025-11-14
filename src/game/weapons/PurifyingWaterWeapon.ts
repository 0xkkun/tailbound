/**
 * 정화수 무기
 *
 * 타입: 투척형 (Throwable)
 * 물병을 던져서 착탄 시 범위 피해
 */
import { WEAPON_BALANCE } from '@config/balance.config';
import { calculateWeaponStats } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies';
import type { Player } from '@game/entities/Player';
import { WaterBottle } from '@game/entities/WaterBottle';
import { findClosestEnemies } from '@game/utils/targeting';
import type { Vector2 } from '@type/game.types';

import { Weapon } from './Weapon';

export class PurifyingWaterWeapon extends Weapon {
  private bottles: WaterBottle[] = [];
  private throwCount: number;
  private maxThrowRange: number;
  private aoeRadius: number;
  private bottleSpeed: number;

  constructor() {
    const stats = calculateWeaponStats('purifying_water', 1);
    super('weapon_purifying_water', '정화수', stats.damage, stats.cooldown);

    const config = WEAPON_BALANCE.purifying_water;
    this.throwCount = config.projectileCount;
    this.maxThrowRange = config.maxThrowRange;
    this.aoeRadius = config.aoeRadius;
    this.bottleSpeed = config.projectileSpeed;
  }

  /**
   * 정화수 투척 (WaterBottle 투사체 생성)
   */
  public async fire(
    playerPos: Vector2,
    enemies: BaseEnemy[],
    player?: Player
  ): Promise<WaterBottle[]> {
    if (!this.canFire()) {
      return [];
    }

    const newBottles: WaterBottle[] = [];
    const config = WEAPON_BALANCE.purifying_water;

    // 가까운 적 N개 찾기
    const targets = findClosestEnemies(playerPos, enemies, this.throwCount, this.maxThrowRange);

    if (targets.length === 0) {
      // 적이 없으면 발사하지 않음
      return [];
    }

    // 각 타겟을 향해 물병 투척 (각도 분산)
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const baseTargetPos = { x: target.x, y: target.y };

      // 각도 분산 계산 (여러 개를 던질 때 퍼뜨림)
      let finalTargetPos = baseTargetPos;
      if (targets.length > 1) {
        const dx = baseTargetPos.x - playerPos.x;
        const dy = baseTargetPos.y - playerPos.y;
        const baseAngle = Math.atan2(dy, dx);

        // 전체 퍼짐 각도 (config에서 가져옴)
        const spreadAngle = config.throwSpreadAngle;
        const angleOffset =
          (i - (targets.length - 1) / 2) * (spreadAngle / Math.max(targets.length - 1, 1));
        const newAngle = baseAngle + angleOffset;

        // 타겟 거리
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 새로운 타겟 위치 (각도 분산)
        finalTargetPos = {
          x: playerPos.x + Math.cos(newAngle) * distance,
          y: playerPos.y + Math.sin(newAngle) * distance,
        };
      }

      // 물병 생성
      const bottle = new WaterBottle(
        playerPos.x,
        playerPos.y,
        finalTargetPos.x,
        finalTargetPos.y,
        this.bottleSpeed,
        this.aoeRadius,
        config.arcHeight
      );

      // 치명타 판정 및 데미지 계산
      if (player) {
        const critResult = player.rollCritical();
        bottle.isCritical = critResult.isCritical;
        bottle.damage = this.damage * critResult.damageMultiplier;
      } else {
        bottle.damage = this.damage;
      }

      // 물병 스프라이트 로드 (32x32)
      await bottle.loadSprite();

      newBottles.push(bottle);
    }

    this.bottles.push(...newBottles);

    // 쿨다운 리셋
    this.resetCooldown(player);

    return newBottles;
  }

  /**
   * 매 프레임 업데이트 (투사체만)
   */
  public updateBottles(deltaTime: number): void {
    // 비활성화된 물병 제거
    this.bottles = this.bottles.filter((bottle) => {
      if (!bottle.active) {
        if (bottle.parent) {
          bottle.parent.removeChild(bottle);
        }
        bottle.destroy();
        return false;
      }

      // 물병 업데이트
      bottle.update(deltaTime);
      return true;
    });
  }

  /**
   * 착탄한 물병들의 정보 가져오기 (스플래시 생성용)
   */
  public getReachedBottles(): Array<{
    x: number;
    y: number;
    damage: number;
    isCritical: boolean;
    aoeRadius: number;
  }> {
    return this.bottles
      .filter((bottle) => bottle.hasReached())
      .map((bottle) => ({
        x: bottle.targetPos.x,
        y: bottle.targetPos.y,
        damage: bottle.damage,
        isCritical: bottle.isCritical,
        aoeRadius: bottle.aoeRadius,
      }));
  }

  /**
   * 레벨업
   */
  public levelUp(): void {
    super.levelUp();

    const stats = calculateWeaponStats('purifying_water', this.level);
    const config = WEAPON_BALANCE.purifying_water;

    this.damage = stats.damage;
    this.cooldown = stats.cooldown;

    // 레벨업 효과
    // throwCountInterval마다 투척 개수 증가 (최대 maxThrowCount까지)
    if (this.level % config.levelScaling.throwCountInterval === 0) {
      if (this.throwCount < config.maxThrowCount) {
        this.throwCount++;
      }
    }

    // aoeRadiusIncreaseInterval마다 범위 증가
    if (this.level % config.levelScaling.aoeRadiusIncreaseInterval === 0) {
      this.aoeRadius += config.levelScaling.aoeRadiusPerLevel;
    }

    console.log(
      `💧 정화수 레벨 ${this.level}! (투척: ${this.throwCount}개, 범위: ${this.aoeRadius}, 데미지: ${this.damage})`
    );
  }

  /**
   * 정리
   */
  public destroyBottles(): void {
    for (const bottle of this.bottles) {
      if (bottle.parent) {
        bottle.parent.removeChild(bottle);
      }
      bottle.destroy();
    }
    this.bottles = [];
  }

  /**
   * 물병 접근자
   */
  public getBottles(): WaterBottle[] {
    return this.bottles;
  }
}
