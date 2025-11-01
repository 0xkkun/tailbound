/**
 * 적 데이터 정의
 */

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
 * 게임 시간에 따른 필드몹 티어 확률 계산
 */
export function getFieldEnemyTierProbability(gameTime: number): {
  low: number;
  medium: number;
  high: number;
} {
  // main 브랜치 패턴 적용 (normal→low, elite→medium, boss→high)
  // 초기: 100% low
  // 2분 후: 80% low, 20% medium
  // 5분 후: 60% low, 35% medium, 5% high
  // 8분 후: 50% low, 40% medium, 10% high

  if (gameTime < 120) {
    // 0-2분: 서서히 medium 등장
    const progress = gameTime / 120;
    const mediumChance = progress * 0.2;
    return {
      low: 1 - mediumChance,
      medium: mediumChance,
      high: 0,
    };
  }

  if (gameTime < 300) {
    // 2-5분: medium 증가, high 등장 시작
    const progress = (gameTime - 120) / (300 - 120);
    const mediumChance = 0.2 + progress * 0.15;
    const highChance = progress * 0.05;
    return {
      low: 1 - mediumChance - highChance,
      medium: mediumChance,
      high: highChance,
    };
  }

  // 5-8분 이후: 최종 밸런스
  const progress = Math.min(1, (gameTime - 300) / (480 - 300));
  const mediumChance = 0.35 + progress * 0.05;
  const highChance = 0.05 + progress * 0.05;
  return {
    low: 1 - mediumChance - highChance,
    medium: mediumChance,
    high: highChance,
  };
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
