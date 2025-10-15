/**
 * 전투 시스템 (충돌 감지 및 데미지 처리)
 */

import type { Enemy } from '@/game/entities/Enemy';
import type { Player } from '@/game/entities/Player';
import type { Projectile } from '@/game/entities/Projectile';
import { checkCircleCollision } from '@/game/utils/collision';

export class CombatSystem {
  /**
   * 전투 시스템 업데이트
   */
  public update(player: Player, enemies: Enemy[], projectiles: Projectile[]): number {
    let enemiesKilled = 0;

    // 1. 투사체 vs 적 충돌
    for (const projectile of projectiles) {
      if (!projectile.active) {
        continue;
      }

      for (const enemy of enemies) {
        if (!enemy.active || !enemy.isAlive()) {
          continue;
        }

        if (checkCircleCollision(projectile, enemy)) {
          // 데미지 적용
          enemy.takeDamage(projectile.damage);

          // 적 사망 체크
          if (!enemy.isAlive()) {
            enemy.active = false;
            enemiesKilled++;
            console.log(`적 처치! (남은 적: ${enemies.filter((e) => e.isAlive()).length})`);
          }

          // 투사체 히트 처리
          projectile.onHit();
        }
      }
    }

    // 2. 적 vs 플레이어 충돌
    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive()) {
        continue;
      }

      if (checkCircleCollision(enemy, player)) {
        // 플레이어 데미지
        player.takeDamage(enemy.damage);

        // 플레이어 사망 체크
        if (!player.isAlive()) {
          console.log('플레이어 사망!');
        }
      }
    }

    return enemiesKilled;
  }
}
