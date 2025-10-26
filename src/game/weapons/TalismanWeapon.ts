/**
 * 부적 무기 (투사체 발사)
 */

import { calculateWeaponStats } from '@/game/data/weapons';
import type { BaseEnemy } from '@/game/entities/enemies';
import type { Player } from '@/game/entities/Player';
import { Projectile } from '@/game/entities/Projectile';
import { getDirection, getDistance } from '@/game/utils/collision';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

export class TalismanWeapon extends Weapon {
  private projectileIdCounter: number = 0;
  private projectileCount: number = 1; // 발사할 투사체 개수
  private readonly MAX_FIRE_RANGE = 600; // 최대 발사 거리 (화면 크기 정도)

  constructor() {
    const stats = calculateWeaponStats('talisman', 1);
    super('부적', stats.damage, stats.cooldown);
  }

  /**
   * 발사
   */
  public async fire(
    playerPos: Vector2,
    enemies: BaseEnemy[],
    player?: Player
  ): Promise<Projectile[]> {
    if (!this.canFire()) {
      return [];
    }

    const projectiles: Projectile[] = [];

    // 가까운 적 N개 찾기 (투사체 개수만큼)
    const targets = this.findClosestEnemies(playerPos, enemies, this.projectileCount);

    if (targets.length === 0) {
      // 적이 없으면 발사하지 않음
      return [];
    }

    // 각 타겟을 향해 투사체 발사
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target) continue;

      // 타겟을 향한 방향 계산
      const targetPos = { x: target.x, y: target.y };
      const direction = getDirection(playerPos, targetPos);

      // 투사체 생성
      const projectile = new Projectile(
        `talisman_${this.projectileIdCounter++}`,
        playerPos.x,
        playerPos.y,
        direction,
        0xffff00 // 노란색
      );

      // 치명타 판정 및 데미지 계산
      if (player) {
        const critResult = player.rollCritical();
        projectile.isCritical = critResult.isCritical;
        projectile.damage = this.damage * critResult.damageMultiplier;
        projectile.playerRef = player;

        // 치명타 시각 효과 (노란색 -> 빨간색)
        if (critResult.isCritical) {
          // 색상은 나중에 스프라이트 로드 전에 변경
        }
      } else {
        projectile.damage = this.damage;
      }

      // 부적 스프라이트 로드 (6x4 = 24 프레임, 각 프레임 32x32)
      await projectile.loadSpriteSheet('/assets/weapon/talisman.png', 32, 32, 24, 6);

      projectiles.push(projectile);
    }

    // 쿨다운 리셋
    this.resetCooldown();

    return projectiles;
  }

  /**
   * 가장 가까운 적 찾기 (범위 내에서만)
   */
  private findClosestEnemy(playerPos: Vector2, enemies: BaseEnemy[]): BaseEnemy | null {
    if (enemies.length === 0) {
      return null;
    }

    let closest: BaseEnemy | null = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive()) {
        continue;
      }

      const enemyPos = { x: enemy.x, y: enemy.y };
      const distance = getDistance(playerPos, enemyPos);

      // 최대 발사 거리 내에 있고, 가장 가까운 적만 선택
      if (distance <= this.MAX_FIRE_RANGE && distance < minDistance) {
        minDistance = distance;
        closest = enemy;
      }
    }

    return closest;
  }

  /**
   * 가까운 적 N개 찾기 (범위 내에서만)
   */
  private findClosestEnemies(
    playerPos: Vector2,
    enemies: BaseEnemy[],
    count: number
  ): BaseEnemy[] {
    // 범위 내 적들을 거리 순으로 정렬
    const enemiesWithDistance = enemies
      .filter((enemy) => enemy.active && enemy.isAlive())
      .map((enemy) => {
        const enemyPos = { x: enemy.x, y: enemy.y };
        const distance = getDistance(playerPos, enemyPos);
        return { enemy, distance };
      })
      .filter((item) => item.distance <= this.MAX_FIRE_RANGE)
      .sort((a, b) => a.distance - b.distance);

    // 가까운 적 N개 반환
    return enemiesWithDistance.slice(0, count).map((item) => item.enemy);
  }

  /**
   * 레벨업
   */
  public levelUp(): void {
    super.levelUp();

    // 레벨에 따른 스탯 재계산
    const stats = calculateWeaponStats('talisman', this.level);
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;

    // 투사체 개수 증가 (홀수 레벨마다 +1, 최대 5개)
    if (this.level >= 3 && this.level % 2 === 1 && this.projectileCount < 5) {
      this.projectileCount++;
    }

    console.log(
      `📜 부적 레벨 ${this.level}! (투사체: ${this.projectileCount}개, 데미지: ${this.damage})`
    );
  }
}
