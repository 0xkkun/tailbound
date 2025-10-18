/**
 * 적 스프라이트 설정 인터페이스
 */

import type { Texture } from 'pixi.js';

export interface EnemySpriteConfig {
  /** 스프라이트 시트 경로 */
  assetPath: string;
  /** 스프라이트 시트 전체 너비 */
  totalWidth: number;
  /** 스프라이트 시트 높이 */
  height: number;
  /** 프레임 개수 */
  frameCount: number;
  /** 스프라이트 스케일 */
  scale: number;
  /** 애니메이션 속도 (tier별 오버라이드 가능) */
  animationSpeed?: number;
}

export interface EnemySpriteCache {
  config: EnemySpriteConfig;
  frames: Texture[] | null;
  isLoading: boolean;
  loadPromise: Promise<void> | null;
}
