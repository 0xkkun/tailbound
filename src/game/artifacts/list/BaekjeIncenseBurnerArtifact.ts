/**
 * 백제 금동대향로 유물
 * 작두 무기를 진화시키는 유물 (7레벨 달성 시)
 */

import { LOCAL_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class BaekjeIncenseBurnerArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'baekje_incense_burner',
      name: '백제 금동대향로',
      tier: 2,
      rarity: 'rare',
      category: 'evolution',
      description: '[작두] 작두 무기 레벨 7 달성 시 진화',
      iconPath: LOCAL_ASSETS.baekjeIncenseBurnerArtifact,
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
