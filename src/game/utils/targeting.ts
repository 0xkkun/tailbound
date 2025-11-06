/**
 * 타겟팅 유틸리티 함수
 *
 * 무기 시스템에서 공통으로 사용하는 타겟 선택 로직
 */
import type { BaseEnemy } from '@game/entities/enemies';
import type { Vector2 } from '@type/game.types';

import { getDistance } from './collision';

/**
 * 가까운 적 N개 찾기 (범위 내에서만)
 *
 * @param origin - 기준 위치 (플레이어 위치)
 * @param enemies - 적 배열
 * @param count - 찾을 적의 개수
 * @param maxRange - 최대 탐색 거리
 * @returns 거리 순으로 정렬된 가까운 적 배열
 */
export function findClosestEnemies(
  origin: Vector2,
  enemies: BaseEnemy[],
  count: number,
  maxRange: number
): BaseEnemy[] {
  // 범위 내 적들을 거리 순으로 정렬
  const enemiesWithDistance = enemies
    .filter((enemy) => enemy.active && enemy.isAlive())
    .map((enemy) => {
      const enemyPos = { x: enemy.x, y: enemy.y };
      const distance = getDistance(origin, enemyPos);
      return { enemy, distance };
    })
    .filter((item) => item.distance <= maxRange)
    .sort((a, b) => a.distance - b.distance);

  // 가까운 적 N개 반환
  return enemiesWithDistance.slice(0, count).map((item) => item.enemy);
}
