/**
 * 전투 시스템 (충돌 감지 및 데미지 처리)
 */

import { KNOCKBACK_BALANCE, POTION_BALANCE } from '@/config/balance.config';
import type { BaseEnemy } from '@/game/entities/enemies';
import type { Player } from '@/game/entities/Player';
import type { Projectile } from '@/game/entities/Projectile';
import { checkCircleCollision } from '@/game/utils/collision';

// 적 처치 결과
export interface KillResult {
  enemy: BaseEnemy;
  position: { x: number; y: number };
  xpValue: number;
  dropPotion: boolean; // 체력 포션 드랍 여부 (10% 확률)
}

export class CombatSystem {
  // 적 처치 콜백
  public onEnemyKilled?: (result: KillResult) => void;

  /**
   * 전투 시스템 업데이트
   */
  public update(player: Player, enemies: BaseEnemy[], projectiles: Projectile[]): number {
    let enemiesKilled = 0;

    // 1. 투사체 vs 적 충돌
    for (const projectile of projectiles) {
      if (!projectile.active) {
        continue;
      }

      for (const enemy of enemies) {
        // 죽은 적이거나 이미 맞힌 적은 스킵
        if (!enemy.active || !enemy.isAlive() || projectile.hasHitEnemy(enemy.id)) {
          continue;
        }

        if (checkCircleCollision(projectile, enemy)) {
          // 데미지 적용 (projectile.damage는 이미 치명타가 적용된 상태)
          const finalDamage = projectile.damage;

          enemy.takeDamage(finalDamage);

          // 흡혈 처리 (플레이어가 있으면)
          if (projectile.playerRef) {
            projectile.playerRef.applyLifeSteal(finalDamage);
          }

          // 넉백 적용 (투사체 방향으로 밀어냄)
          const knockbackDir = {
            x: enemy.x - projectile.x,
            y: enemy.y - projectile.y,
          };
          enemy.applyKnockback(knockbackDir, KNOCKBACK_BALANCE.projectile);

          // 적 사망 체크
          if (!enemy.isAlive()) {
            enemy.active = false;
            enemiesKilled++;
            console.log(`적 처치! (남은 적: ${enemies.filter((e) => e.isAlive()).length})`);

            // 경험치 값은 enemy 객체에서 직접 가져옴
            const xpValue = enemy.xpDrop;

            // 체력 포션 드랍 확률 (플레이어의 드롭률 배수 적용)
            const finalDropRate = POTION_BALANCE.dropRate * player.dropRateMultiplier;
            const dropPotion = Math.random() < finalDropRate;

            // 적 처치 콜백 호출 (경험치 젬 및 포션 드랍용)
            this.onEnemyKilled?.({
              enemy,
              position: { x: enemy.x, y: enemy.y },
              xpValue,
              dropPotion,
            });
          }

          // 투사체 히트 처리 (중복 피해 방지)
          projectile.hitEnemy(enemy.id);

          // 관통 없으면 투사체 즉시 제거
          if (projectile.piercing === 0) {
            projectile.active = false;
            break; // 더 이상 충돌 체크 불필요
          }
          // piercing > 0 또는 Infinity면 계속 날아감
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
