/**
 * Toss App Bridge - 인앱 토스 환경 안전 래퍼
 *
 * @apps-in-toss/web-framework의 메서드들은 인앱 토스 환경에서만 동작합니다.
 * 이 모듈은 해당 메서드들을 안전하게 호출할 수 있도록 래핑하여,
 * 인앱 토스가 아닌 환경에서도 오류 없이 동작하도록 합니다.
 */

import {
  generateHapticFeedback,
  getSafeAreaInsets,
  getTossAppVersion,
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
