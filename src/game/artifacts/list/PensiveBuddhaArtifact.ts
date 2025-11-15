/**
 * 금동미륵보살반가사유상 유물
 * 목탁소리 무기를 진화시키는 유물 (7레벨 달성 시)
 */

import { LOCAL_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class PensiveBuddhaArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'pensive_buddha',
      name: '금동미륵보살반가사유상',
      tier: 2,
      rarity: 'rare',
      category: 'evolution',
      description: '[목탁소리] 목탁소리 무기 레벨 7 달성 시 진화',
      iconPath: LOCAL_ASSETS.pensiveBuddhaArtifact,
      color: 0xffd700, // 골드
    });
  }

  /**
   * 정리
   */
  public cleanup(): void {
    super.cleanup();
  }
}
