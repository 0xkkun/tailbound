/**
 * 부채바람 무기
 *
 * 뱀파이어 서바이벌의 도끼처럼 일정 거리까지 몬스터를 무제한 관통하며 날아감
 * 레벨업 시 투사체 수량이 증가하고 데미지가 증가
 */

import { WEAPON_BALANCE } from '@/config/balance.config';
import { calculateWeaponStats, getWeaponData } from '@/game/data/weapons';
import type { Vector2 } from '@/types/game.types';

import type { BaseEnemy } from '../entities/enemies/BaseEnemy';
import type { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

import { Weapon } from './Weapon';

export class FanWindWeapon extends Weapon {
  private projectileCount: number = 1; // 투사체 개수
  private weaponData = getWeaponData('fan_wind');

  constructor() {
    const stats = calculateWeaponStats('fan_wind', 1);
    super('부채바람', stats.damage, stats.cooldown);
  }

  /**
   * 부채꼴 패턴으로 투사체 발사
   */
  public fire(playerPos: Vector2, enemies: BaseEnemy[], player?: Player): Projectile[] {
    if (!this.canFire()) return [];

    const projectiles: Projectile[] = [];

    // 여러 개일 때는 가까운 적들을 각각 타겟팅, 1개일 때는 가장 가까운 적
    const targets =
      this.projectileCount > 1
        ? this.findClosestEnemies(playerPos, enemies, this.projectileCount)
        : [this.findClosestEnemy(playerPos, enemies)];

    // 투사체 개수에 따라 발사
    for (let i = 0; i < this.projectileCount; i++) {
      // 타겟이 있으면 해당 타겟 방향, 없으면 기본 방향 (오른쪽)
      const target = targets[i] || null;
      const direction = target
        ? this.getDirection(playerPos, { x: target.x, y: target.y })
        : { x: 1, y: 0 };

      // 투사체 생성
      const projectile = new Projectile(
        `fanwind_${Date.now()}_${i}`,
        playerPos.x,
        playerPos.y,
        direction,
        0x87ceeb // 하늘색 (부채바람 색상)
      );

      // 치명타 판정 및 데미지 계산
      if (player) {
        const critResult = player.rollCritical();
        projectile.isCritical = critResult.isCritical;
        const finalDamage = this.damage * critResult.damageMultiplier;
        projectile.setDamage(finalDamage); // baseDamage도 함께 설정
        projectile.playerRef = player;
      } else {
        projectile.setDamage(this.damage);
      }

      projectile.speed = this.weaponData.projectileSpeed || 350;
      projectile.lifeTime = this.weaponData.projectileLifetime || 1.2;
      projectile.radius = this.weaponData.projectileRadius || 15;
      projectile.piercing = Infinity; // 무제한 관통

      // 관통 시 데미지 감소 활성화
      projectile.damageDecayEnabled = true;
      projectile.damageDecayMin = WEAPON_BALANCE.fan_wind.damageDecayMin;

      // wind.png 스프라이트 애니메이션 로드
      projectile.loadSpriteSheet('/assets/weapon/wind.png', 96, 96, 12, 12);

      projectiles.push(projectile);
    }

    this.resetCooldown();
    return projectiles;
  }

  /**
   * 레벨업: 투사체 수량 증가, 데미지 증가
   */
  public levelUp(): void {
    super.levelUp();

    // 데이터에서 새 스탯 계산
    const stats = calculateWeaponStats('fan_wind', this.level);
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;

    // 레벨업 시 투사체 수량 증가
    if (this.level === 2) {
      this.projectileCount = 2; // 레벨 2: 2개
    } else if (this.level === 3) {
      this.projectileCount = 3; // 레벨 3: 3개
    } else if (this.level === 4) {
      this.projectileCount = 4; // 레벨 4: 4개
    } else if (this.level === 5) {
      this.projectileCount = 5; // 레벨 5: 5개
    }

    console.log(
      `🌪️ 부채바람 레벨 ${this.level}! (투사체: ${this.projectileCount}개, 데미지: ${this.damage})`
    );
  }

  /**
   * 가장 가까운 적 찾기
   */
  private findClosestEnemy(playerPos: Vector2, enemies: BaseEnemy[]): BaseEnemy | null {
    let closest: BaseEnemy | null = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive()) continue;

      const dx = enemy.x - playerPos.x;
      const dy = enemy.y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closest = enemy;
      }
    }

    return closest;
  }

  /**
   * 가까운 적 N개 찾기 (여러 방향 타겟팅용)
   */
  private findClosestEnemies(
    playerPos: Vector2,
    enemies: BaseEnemy[],
    count: number
  ): (BaseEnemy | null)[] {
    // 거리 순으로 정렬된 적 배열 생성
    const enemiesWithDistance = enemies
      .filter((enemy) => enemy.active && enemy.isAlive())
      .map((enemy) => {
        const dx = enemy.x - playerPos.x;
        const dy = enemy.y - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return { enemy, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    // 가까운 적 N개 반환 (부족하면 null로 채움)
    const result: (BaseEnemy | null)[] = [];
    for (let i = 0; i < count; i++) {
      result.push(enemiesWithDistance[i]?.enemy || null);
    }

    return result;
  }

  /**
   * 방향 벡터 계산
   */
  private getDirection(from: Vector2, to: Vector2): Vector2 {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return { x: 1, y: 0 };

    return {
      x: dx / length,
      y: dy / length,
    };
  }
}
