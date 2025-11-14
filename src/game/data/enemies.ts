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
 * 네임드 타입
 */
export type NamedEnemyType =
  | 'hongkakchu' // 붉은뿔의 홍각추 도깨비
  | 'hanwolryeong' // 혼이시린 월백의 한월령 (처녀귀신)
  | 'amhonryeong' // 불결한 흑기의 암혼령 (악령)
  | 'heuiguryeong' // 섬뜩한 웃음탈 희구령 (탈)
  | 'hyeolmihowang' // 매혹의 적미 혈미호왕 (구미호)
  | 'gomokjang' // 백년된 노목의 고목장 (장승)
  | 'simyeongaek'; // 어두운 수심의 심연객 (물귀신)

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

/**
 * 네임드 몬스터 메타데이터
 */
export const NAMED_ENEMY_META = {
  hongkakchu: {
    displayName: '붉은뿔의 홍각추 도깨비',
    baseEnemyType: 'dokkaebi',
    description: '탱커형 근접 공격 (추후 구현)',
  },
  hanwolryeong: {
    displayName: '혼이시린 월백의 한월령',
    baseEnemyType: 'maidenGhost',
    description: '원거리 공격 (추후 구현)',
  },
  amhonryeong: {
    displayName: '불결한 흑기의 암혼령',
    baseEnemyType: 'evilSpirit',
    description: '원거리 공격 (추후 구현)',
  },
  heuiguryeong: {
    displayName: '섬뜩한 웃음탈 희구령',
    baseEnemyType: 'mask',
    description: '빠른 근접 암살자 (추후 구현)',
  },
  hyeolmihowang: {
    displayName: '매혹의 적미 혈미호왕',
    baseEnemyType: 'fox',
    description: '특수 패턴 (매혹 디버프 추후 구현)',
  },
  gomokjang: {
    displayName: '백년된 노목의 고목장',
    baseEnemyType: 'totem',
    description: '느린 탱커 (추후 구현)',
  },
  simyeongaek: {
    displayName: '어두운 수심의 심연객',
    baseEnemyType: 'waterGhost',
    description: '빠른 근접 (추후 구현)',
  },
} as const;

/**
 * 모든 네임드 타입 배열
 */
export const ALL_NAMED_TYPES: NamedEnemyType[] = [
  'hongkakchu',
  'hanwolryeong',
  'amhonryeong',
  'heuiguryeong',
  'hyeolmihowang',
  'gomokjang',
  'simyeongaek',
];

/**
 * 랜덤 네임드 타입 선택
 */
export function selectRandomNamedType(): NamedEnemyType {
  return ALL_NAMED_TYPES[Math.floor(Math.random() * ALL_NAMED_TYPES.length)];
}
