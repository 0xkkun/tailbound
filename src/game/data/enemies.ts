/**
 * 적 데이터 정의
 */

import { SPAWN_BALANCE } from '@config/balance.config';

/**
 * 필드몹 티어
 * - low: 하급령 (약한 적)
 * - medium: 중급령 (일반 적)
 * - high: 상급령 (강한 적)
 */
export type FieldEnemyTier = 'low' | 'medium' | 'high';

/**
 * 네임드 타입 (향후 구현)
 */
export type NamedEnemyType =
  | 'dokkaebi_captain'
  | 'ghost_general'
  | 'fox_elder'
  | 'reaper_commander';

/**
 * 보스 타입
 */
export type BossType = 'white_tiger';

/**
 * 적 카테고리
 */
export type EnemyCategory = 'field' | 'named' | 'boss';

/**
 * 게임 시간에 따른 필드몹 티어 확률 계산 (밸런스 설정 사용)
 */
export function getFieldEnemyTierProbability(gameTime: number): {
  low: number;
  medium: number;
  high: number;
} {
  const phases = SPAWN_BALANCE.timePhases;
  const probs = SPAWN_BALANCE.tierProbabilityByPhase;

  if (gameTime < phases.phase1) {
    return probs.phase0;
  } else if (gameTime < phases.phase2) {
    return probs.phase1;
  } else if (gameTime < phases.phase3) {
    return probs.phase2;
  } else if (gameTime < phases.phase4) {
    return probs.phase3;
  } else if (gameTime < phases.final) {
    return probs.phase4;
  } else {
    return probs.final;
  }
}

/**
 * 확률에 따라 필드몹 티어 선택
 */
export function selectFieldEnemyTier(gameTime: number): FieldEnemyTier {
  const probabilities = getFieldEnemyTierProbability(gameTime);
  const roll = Math.random();

  if (roll < probabilities.low) {
    return 'low';
  }
  if (roll < probabilities.low + probabilities.medium) {
    return 'medium';
  }
  return 'high';
}
