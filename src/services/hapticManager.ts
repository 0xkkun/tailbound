/**
 * HapticManager - 앱인토스 햅틱 피드백 관리
 *
 * 게임 이벤트에 따른 진동 피드백을 제공합니다.
 * - 피격: basicMedium (중간 강도)
 * - 죽음: error (오류 패턴)
 */

import { type HapticFeedbackType, safeGenerateHapticFeedback } from '@utils/tossAppBridge';

export class HapticManager {
  private static instance: HapticManager;
  private enabled: boolean = true;

  private constructor() {
    // LocalStorage에서 설정 로드
    const saved = localStorage.getItem('haptic_enabled');
    this.enabled = saved !== null ? saved === 'true' : true;
  }

  static getInstance(): HapticManager {
    if (!HapticManager.instance) {
      HapticManager.instance = new HapticManager();
    }
    return HapticManager.instance;
  }

  /**
   * 진동 활성화 상태 확인
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 진동 ON/OFF 토글
   * @returns 새로운 활성화 상태
   */
  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('haptic_enabled', String(this.enabled));

    // 토글 시 즉각 피드백 (테스트용)
    if (this.enabled) {
      this.triggerImmediate('basicMedium');
    }

    return this.enabled;
  }

  /**
   * 햅틱 피드백 트리거 (설정 확인)
   */
  private async trigger(type: HapticFeedbackType): Promise<void> {
    if (!this.enabled) return;

    await safeGenerateHapticFeedback({ type });
  }

  /**
   * 설정 무시하고 즉시 트리거 (설정 화면용)
   */
  private async triggerImmediate(type: HapticFeedbackType): Promise<void> {
    await safeGenerateHapticFeedback({ type });
  }

  // === 게임 이벤트별 햅틱 메서드 ===

  /**
   * 플레이어 피격 시 햅틱 피드백
   * 중간 강도(basicMedium)로 명확한 피해 인식
   */
  onPlayerHit(): void {
    void this.trigger('basicMedium');
  }

  /**
   * 플레이어 사망 시 햅틱 피드백
   * 오류 패턴(error)으로 실패 상태 전달
   */
  onPlayerDeath(): void {
    void this.trigger('error');
  }
}

// 싱글톤 인스턴스 export
export const hapticManager = HapticManager.getInstance();
