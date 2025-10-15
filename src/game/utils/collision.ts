/**
 * 충돌 감지 유틸리티
 */

import type { Vector2 } from '@/types/game.types';

/**
 * 두 원형 오브젝트 간의 충돌 감지 (AABB가 아닌 원형 충돌)
 * PixiJS Container를 사용하므로 x, y 좌표 직접 사용
 */
export function checkCircleCollision(
  obj1: { x: number; y: number; radius: number },
  obj2: { x: number; y: number; radius: number }
): boolean {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < obj1.radius + obj2.radius;
}

/**
 * 두 점 사이의 거리 계산
 */
export function getDistance(pos1: Vector2, pos2: Vector2): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 두 점 사이의 방향 벡터 계산 (정규화됨)
 */
export function getDirection(from: Vector2, to: Vector2): Vector2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: dx / distance,
    y: dy / distance,
  };
}
