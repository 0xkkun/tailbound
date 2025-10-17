/**
 * 게임 전역 설정
 */

export const GAME_CONFIG = {
  // 화면 설정
  screen: {
    width: 1280,
    height: 720,
    backgroundColor: 0x0a0a15,
  },

  // 월드(맵) 설정
  world: {
    width: 3200, // 맵 너비 (화면의 약 2.5배)
    height: 2400, // 맵 높이 (화면의 약 3.3배)
  },

  // 게임 시간
  time: {
    victoryTime: 600, // 10분 생존 시 승리
    difficultyIncreaseInterval: 10, // 10초마다 난이도 증가
  },

  // 레벨업 설정
  levelUp: {
    baseXpRequired: 100, // 첫 레벨업 필요 경험치
    xpScaling: 1.2, // 레벨당 경험치 증가율
    maxLevel: 99,
  },

  // 투사체 제한
  projectile: {
    maxCount: 500, // 최대 투사체 수
    outOfBoundsMargin: 100, // 화면 밖 마진
  },

  // 적 제한
  enemy: {
    maxCount: 200, // 최대 적 수
  },

  // UI 설정
  ui: {
    healthBarHeight: 4,
    healthBarOffset: -40,
  },
} as const;
