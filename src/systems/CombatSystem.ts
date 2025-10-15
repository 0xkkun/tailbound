/**
 * 전투 시스템 (충돌 감지 및 데미지 처리)
 */

import { ENEMY_BALANCE } from '@/config/balance.config';
import type { Enemy } from '@/game/entities/Enemy';
import type { Player } from '@/game/entities/Player';
import type { Projectile } from '@/game/entities/Projectile';
import { checkCircleCollision } from '@/game/utils/collision';

// 적 처치 결과
export interface KillResult {
  enemy: Enemy;
  position: { x: number; y: number };
  xpValue: number;
}

export class CombatSystem {
  // 적 처치 콜백
  public onEnemyKilled?: (result: KillResult) => void;

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

            // 경험치 값 결정 (적 티어에 따라)
            const tier = enemy.tier || 'normal';
            const xpValue = ENEMY_BALANCE[tier].xpDrop;

            // 적 처치 콜백 호출 (경험치 젬 드랍용)
            this.onEnemyKilled?.({
              enemy,
              position: { x: enemy.x, y: enemy.y },
              xpValue,
            });
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
