/**
 * 오디오 관련 타입 정의
 */

import { CDN_BASE_URL } from '@config/assets.config';

/**
 * 지원되는 효과음 타입
 * TODO: 효과음 추가
 */
export type SFXType = 'hit' | 'death' | 'levelup' | 'button-click';

/**
 * BGM 트랙 이름
 */
export type BGMTrack = 'main' | 'game-01' | 'game-02';

/**
 * BGM 파일 경로 매핑 (CDN)
 */
export const BGM_PATHS: Record<BGMTrack, string> = {
  main: `${CDN_BASE_URL}/audio/bgm-main.mp3`,
  'game-01': `${CDN_BASE_URL}/audio/bgm-game-01.mp3`,
  'game-02': `${CDN_BASE_URL}/audio/bgm-game-02.mp3`,
};
