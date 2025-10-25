/**
 * 부채바람 무기
 *
 * 뱀파이어 서바이벌의 도끼처럼 일정 거리까지 몬스터를 무제한 관통하며 날아감
 * 레벨업 시 투사체 수량이 증가하고 데미지가 증가
 */

import { calculateWeaponStats, getWeaponData } from '@/game/data/weapons';
import type { Vector2 } from '@/types/game.types';

import type { BaseEnemy } from '../entities/enemies/BaseEnemy';
import type { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

import { Weapon } from './Weapon';

export class FanWindWeapon extends Weapon {
  private projectileCount: number = 1; // 투사체 개수
  private spreadAngle: number = Math.PI / 6; // 30도 부채꼴
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

    // 가장 가까운 적 방향으로 발사 (없으면 오른쪽)
    const target = this.findClosestEnemy(playerPos, enemies);
    const baseDirection = target
      ? this.getDirection(playerPos, { x: target.x, y: target.y })
      : { x: 1, y: 0 };

    // 중앙 각도 계산
    const baseAngle = Math.atan2(baseDirection.y, baseDirection.x);

    // 투사체 개수에 따라 부채꼴로 발사
    for (let i = 0; i < this.projectileCount; i++) {
      let angle: number;

      if (this.projectileCount === 1) {
        // 1개일 때: 중앙으로
        angle = baseAngle;
      } else {
        // 여러 개일 때: 부채꼴로 분산
        const step = this.spreadAngle / (this.projectileCount - 1);
        angle = baseAngle - this.spreadAngle / 2 + step * i;
      }

      // 방향 벡터 계산
      const direction = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };

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
        projectile.damage = this.damage * critResult.damageMultiplier;
        projectile.playerRef = player;
      } else {
        projectile.damage = this.damage;
      }

      projectile.speed = this.weaponData.projectileSpeed || 350;
      projectile.lifeTime = this.weaponData.projectileLifetime || 1.2;
      projectile.radius = this.weaponData.projectileRadius || 15;
      projectile.piercing = Infinity; // 무제한 관통

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
