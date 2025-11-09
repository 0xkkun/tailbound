/**
 * Analytics 설정
 *
 * Analytics 관련 상수 및 설정값을 관리합니다.
 */
export const ANALYTICS_CONFIG = {
  /**
   * localStorage 키 이름
   */
  STORAGE_KEYS: {
    /**
     * 세션 카운터 (누적 플레이 횟수)
     */
    SESSION_COUNT: 'tailbound_session_count',
  },
} as const;
