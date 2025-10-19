/**
 * 스프라이트 애니메이션 설정
 */

/**
 * 플레이어 스프라이트 설정
 */
export const PLAYER_SPRITE_CONFIG = {
  // 걷기 애니메이션
  walk: {
    frameCount: 8, // 스프라이트시트 프레임 수
    animationSpeed: 0.15, // 애니메이션 재생 속도
  },
} as const;

/**
 * 적 스프라이트 설정
 */
export const ENEMY_SPRITE_CONFIG = {
  // 일반 적
  skeleton: {
    frameCount: 8,
    animationSpeed: 0.15,
  },
} as const;
