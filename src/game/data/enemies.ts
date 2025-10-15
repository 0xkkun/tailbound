/**
 * 적 데이터 정의
 */

import { ENEMY_BALANCE } from '@/config/balance.config';

/**
 * 적 티어
 */
export type EnemyTier = 'normal' | 'elite' | 'boss';

/**
 * 적 타입 (추후 확장 가능)
 */
export type EnemyType = 'zombie' | 'ghost' | 'dokkaebi' | 'gumiho';

/**
 * 적 데이터 인터페이스
 */
export interface EnemyData {
  id: string;
  name: string;
  tier: EnemyTier;
  health: number;
  speed: number;
  damage: number;
  radius: number;
  xpDrop: number;
  color: number; // 렌더링용 색상
  description?: string;
}

/**
 * 적 데이터베이스 (티어별)
 */
export const ENEMY_DATA: Record<EnemyTier, EnemyData> = {
  normal: {
    id: 'zombie',
    name: '좀비',
    tier: 'normal',
    health: ENEMY_BALANCE.normal.health,
    speed: ENEMY_BALANCE.normal.speed,
    damage: ENEMY_BALANCE.normal.damage,
    radius: ENEMY_BALANCE.normal.radius,
    xpDrop: ENEMY_BALANCE.normal.xpDrop,
    color: 0x55ff55,
    description: '느리지만 끈질긴 언데드',
  },
  elite: {
    id: 'ghost',
    name: '원귀',
    tier: 'elite',
    health: ENEMY_BALANCE.elite.health,
    speed: ENEMY_BALANCE.elite.speed,
    damage: ENEMY_BALANCE.elite.damage,
    radius: ENEMY_BALANCE.elite.radius,
    xpDrop: ENEMY_BALANCE.elite.xpDrop,
    color: 0xff8855,
    description: '빠르고 강력한 원한의 영혼',
  },
  boss: {
    id: 'dokkaebi_boss',
    name: '도깨비 두목',
    tier: 'boss',
    health: ENEMY_BALANCE.boss.health,
    speed: ENEMY_BALANCE.boss.speed,
    damage: ENEMY_BALANCE.boss.damage,
    radius: ENEMY_BALANCE.boss.radius,
    xpDrop: ENEMY_BALANCE.boss.xpDrop,
    color: 0xff5555,
    description: '강력한 보스 도깨비',
  },
};

/**
 * 티어로 적 데이터 가져오기
 */
export function getEnemyDataByTier(tier: EnemyTier): EnemyData {
  return ENEMY_DATA[tier];
}

/**
 * 게임 시간에 따른 적 스탯 스케일링
 */
export function scaleEnemyStats(
  baseData: EnemyData,
  gameTime: number
): {
  health: number;
  damage: number;
  speed: number;
} {
  // 1분(60초)마다 10% 증가
  const scalingFactor = 1 + Math.floor(gameTime / 60) * 0.1;

  return {
    health: Math.floor(baseData.health * scalingFactor),
    damage: Math.floor(baseData.damage * scalingFactor),
    speed: baseData.speed * Math.min(1.3, scalingFactor), // 속도는 최대 30%까지만 증가
  };
}

/**
 * 게임 시간에 따른 적 티어 확률 계산
 */
export function getEnemyTierProbability(gameTime: number): {
  normal: number;
  elite: number;
  boss: number;
} {
  // 초기: 100% normal
  // 2분 후: 80% normal, 20% elite
  // 5분 후: 60% normal, 35% elite, 5% boss
  // 8분 후: 50% normal, 40% elite, 10% boss

  if (gameTime < 120) {
    // 0-2분
    const eliteChance = (gameTime / 120) * 0.2;
    return {
      normal: 1 - eliteChance,
      elite: eliteChance,
      boss: 0,
    };
  }
  if (gameTime < 300) {
    // 2-5분
    const progress = (gameTime - 120) / (300 - 120);
    const eliteChance = 0.2 + progress * 0.15;
    const bossChance = progress * 0.05;
    return {
      normal: 1 - eliteChance - bossChance,
      elite: eliteChance,
      boss: bossChance,
    };
  }
  // 5분 이후
  const progress = Math.min(1, (gameTime - 300) / (480 - 300));
  const eliteChance = 0.35 + progress * 0.05;
  const bossChance = 0.05 + progress * 0.05;
  return {
    normal: 1 - eliteChance - bossChance,
    elite: eliteChance,
    boss: bossChance,
  };
}

/**
 * 확률에 따라 적 티어 선택
 */
export function selectEnemyTier(gameTime: number): EnemyTier {
  const probabilities = getEnemyTierProbability(gameTime);
  const roll = Math.random();

  if (roll < probabilities.boss) {
    return 'boss';
  }
  if (roll < probabilities.boss + probabilities.elite) {
    return 'elite';
  }
  return 'normal';
}
