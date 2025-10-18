/**
 * 플랫폼 감지 유틸리티
 * 모바일/데스크톱 환경 판별 및 테스트 가능한 인터페이스 제공
 */

export class PlatformDetector {
  constructor(private userAgent: string = navigator.userAgent) {}

  /**
   * 모바일 디바이스 감지
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.userAgent);
  }

  /**
   * 터치 지원 확인
   */
  hasTouch(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * 모바일 환경 (터치 지원 + 모바일 UA)
   */
  isMobileDevice(): boolean {
    return this.hasTouch() && this.isMobile();
  }
}

// 싱글톤 인스턴스
export const platform = new PlatformDetector();
