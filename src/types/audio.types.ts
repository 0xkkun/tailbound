/**
 * 오디오 관련 타입 정의
 */

import type { BGM_PATHS, SFX_PATHS } from '@config/assets.config';

/**
 * 지원되는 효과음 타입 (SFX_PATHS의 키에서 추출)
 */
export type SFXType = keyof typeof SFX_PATHS;

/**
 * BGM 트랙 이름 (BGM_PATHS의 키에서 추출)
 */
export type BGMTrack = keyof typeof BGM_PATHS;
