/**
 * 상태 이상 효과 타입 정의
 */

/**
 * 상태 이상 효과 종류
 */
export type StatusEffectType =
  | 'charmed' // 매혹 (구미호의 눈물)
  | 'stunned' // 기절
  | 'slowed' // 둔화
  | 'burning' // 화상
  | 'frozen' // 빙결
  | 'poisoned' // 중독
  | 'bleeding' // 출혈
  | 'confused'; // 혼란

/**
 * 상태 이상 효과 데이터
 */
export interface StatusEffect {
  type: StatusEffectType;
  duration: number; // 남은 시간 (초)
  startTime: number; // 시작 시간
  source?: string; // 효과의 출처 (유물 ID 등)
  data?: Record<string, unknown>; // 추가 데이터 (효과별 커스텀)
}
