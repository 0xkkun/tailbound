/**
 * 오디오 관련 타입 정의
 */

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
 * BGM 파일 경로 매핑
 */
export const BGM_PATHS: Record<BGMTrack, string> = {
  main: '/assets/audio/bgm-main.mp3',
  'game-01': '/assets/audio/bgm-game-01.mp3',
  'game-02': '/assets/audio/bgm-game-02.mp3',
};
