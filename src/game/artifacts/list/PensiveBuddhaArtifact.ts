/**
 * 금동미륵보살반가사유상 유물
 * 목탁소리 무기를 진화시키는 유물 (7레벨 달성 시)
 */

import { CDN_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class PensiveBuddhaArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'pensive_buddha',
      name: '금동미륵보살반가사유상',
      tier: 2,
      rarity: 'legendary',
      category: 'evolution',
      description: '목탁소리 Lv.7 달성 시 진화',
      iconPath: CDN_ASSETS.artifact.pensiveBuddha,
      color: 0xffd700, // 골드
      weaponCategories: ['moktak_sound'], // 목탁소리
    });
  }

  /**
   * 정리
   */
  public cleanup(): void {
    super.cleanup();
  }
}
