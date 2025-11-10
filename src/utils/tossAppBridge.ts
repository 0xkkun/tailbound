/**
 * Toss App Bridge - 인앱 토스 환경 안전 래퍼
 *
 * @apps-in-toss/web-framework의 메서드들은 인앱 토스 환경에서만 동작합니다.
 * 이 모듈은 해당 메서드들을 안전하게 호출할 수 있도록 래핑하여,
 * 인앱 토스가 아닌 환경에서도 오류 없이 동작하도록 합니다.
 */

import {
  Analytics,
  generateHapticFeedback,
  getSafeAreaInsets,
  getTossAppVersion,
  getUserKeyForGame,
  openGameCenterLeaderboard,
  submitGameCenterLeaderBoardScore,
} from '@apps-in-toss/web-framework';

/**
 * 토스 SDK 햅틱 피드백 타입
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/HapticFeedbackOptions.html
 */
export type HapticFeedbackType =
  | 'tickWeak'
  | 'tap'
  | 'tickMedium'
  | 'softMedium'
  | 'basicWeak'
  | 'basicMedium'
  | 'success'
  | 'error'
  | 'wiggle'
  | 'confetti';

export interface HapticFeedbackOptions {
  type: HapticFeedbackType;
}

export interface SafeAreaInsets {
  top: number;
  bottom: number;
}

/**
 * 인앱 토스 환경 여부 체크 (한 번만 실행되고 캐싱됨)
 */
let isInAppToss: boolean | null = null;

function checkIsInAppToss(): boolean {
  if (isInAppToss !== null) {
    return isInAppToss;
  }

  try {
    const version = getTossAppVersion();
    isInAppToss = !!version;
    console.debug('Toss App Environment detected. Version:', version);
  } catch (error) {
    isInAppToss = false;
    console.debug('Not in Toss App Environment:', error);
  }

  return isInAppToss;
}

/**
 * 인앱 토스 환경 여부 확인 (외부에서 사용 가능)
 * @returns 토스 환경 여부
 */
export function isInTossApp(): boolean {
  return checkIsInAppToss();
}

/**
 * 안전한 햅틱 피드백 생성
 * 인앱 토스 환경이 아닐 경우 오류를 무시하고 스킵합니다.
 */
export async function safeGenerateHapticFeedback(options: HapticFeedbackOptions): Promise<void> {
  if (!checkIsInAppToss()) {
    return;
  }

  try {
    await generateHapticFeedback(options);
  } catch (error) {
    console.error('Haptic feedback failed:', error);
  }
}

/**
 * 안전한 Safe Area Insets 가져오기
 * 인앱 토스 환경이 아닐 경우 기본값 { top: 0, bottom: 0, left: 0, right: 0 }을 반환합니다.
 */
export function safeGetSafeAreaInsets(): SafeAreaInsets {
  if (!checkIsInAppToss()) {
    return { top: 0, bottom: 0 };
  }

  try {
    return getSafeAreaInsets();
  } catch (error) {
    console.error('SafeAreaInsets failed:', error);
    return { top: 0, bottom: 0 };
  }
}

/**
 * Analytics에서 허용하는 Primitive 타입
 */
type Primitive = string | number | boolean | null | undefined;

/**
 * 안전한 Analytics 클릭 이벤트 로깅
 * 인앱 토스 환경이 아닐 경우 콘솔 로그만 출력합니다.
 */
export function safeAnalyticsClick(params: Record<string, Primitive>): void {
  if (!checkIsInAppToss()) {
    console.log('[Analytics] Click (not in Toss App):', params);
    return;
  }

  try {
    Analytics.click(params);
    console.log('[Analytics] Click:', params);
  } catch (error) {
    console.error('Analytics.click failed:', error);
  }
}

/**
 * 안전한 Analytics 노출 이벤트 로깅
 * 인앱 토스 환경이 아닐 경우 콘솔 로그만 출력합니다.
 */
export function safeAnalyticsImpression(params: Record<string, Primitive>): void {
  if (!checkIsInAppToss()) {
    console.log('[Analytics] Impression (not in Toss App):', params);
    return;
  }

  try {
    Analytics.impression(params);
    console.log('[Analytics] Impression:', params);
  } catch (error) {
    console.error('Analytics.impression failed:', error);
  }
}

/**
 * 안전한 게임 사용자 키 가져오기
 * 인앱 토스 환경이 아니거나 게임 카테고리가 아닐 경우 null을 반환합니다.
 *
 * @returns 사용자 해시값 또는 null
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/게임/getUserKeyForGame.html
 */
export async function safeGetUserKeyForGame(): Promise<string | null> {
  if (!checkIsInAppToss()) {
    console.log('[getUserKeyForGame] Not in Toss App Environment');
    return null;
  }

  try {
    const result = await getUserKeyForGame();

    if (result === undefined) {
      console.warn('[getUserKeyForGame] Toss App version too old (< 5.232.0)');
      return null;
    }

    if (result === 'INVALID_CATEGORY') {
      console.error('[getUserKeyForGame] Not a game category mini-app');
      return null;
    }

    if (result === 'ERROR') {
      console.error('[getUserKeyForGame] Unknown error occurred');
      return null;
    }

    console.log('[getUserKeyForGame] Success:', result.hash);
    return result.hash;
  } catch (error) {
    console.error('[getUserKeyForGame] Failed:', error);
    return null;
  }
}

/**
 * 안전한 리더보드 열기
 * 인앱 토스 환경이 아니거나 버전이 낮을 경우 아무 동작도 하지 않습니다.
 *
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/게임/openGameCenterLeaderboard.html
 */
export async function safeOpenGameCenterLeaderboard(): Promise<void> {
  if (!checkIsInAppToss()) {
    console.log('[openGameCenterLeaderboard] Not in Toss App Environment');
    return;
  }

  try {
    await openGameCenterLeaderboard();
    console.log('[openGameCenterLeaderboard] Leaderboard opened');
  } catch (error) {
    console.error('[openGameCenterLeaderboard] Failed:', error);
  }
}

/**
 * 안전한 리더보드 점수 제출
 * 인앱 토스 환경이 아니거나 버전이 낮을 경우 false를 반환합니다.
 *
 * @param score 점수 (문자열 형태의 숫자, 예: "123.45")
 * @returns 성공 여부
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/게임/submitGameCenterLeaderBoardScore.html
 */
export async function safeSubmitGameCenterLeaderBoardScore(score: string): Promise<boolean> {
  if (!checkIsInAppToss()) {
    console.log('[submitGameCenterLeaderBoardScore] Not in Toss App Environment');
    return false;
  }

  try {
    const result = await submitGameCenterLeaderBoardScore({ score });

    if (result === undefined) {
      console.warn('[submitGameCenterLeaderBoardScore] Toss App version too old (< 5.221.0)');
      return false;
    }

    if (result.statusCode === 'SUCCESS') {
      console.log('[submitGameCenterLeaderBoardScore] Score submitted successfully:', score);
      return true;
    }

    console.error('[submitGameCenterLeaderBoardScore] Failed with status:', result.statusCode);
    return false;
  } catch (error) {
    console.error('[submitGameCenterLeaderBoardScore] Failed:', error);
    return false;
  }
}
